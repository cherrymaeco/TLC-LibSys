<?php
// user/library_api.php — student-facing API: browse, borrow (reserve), waitlist, My Books.
//   GET  ?action=catalog       books + this student's state for each + borrowing rules
//   GET  ?action=my_books      this student's reserved/borrowed books and waitlist
//   POST {action:"borrow", book_id}              reserve a copy, or join the waitlist if none free
//   POST {action:"leave_waitlist", book_id}
//   POST {action:"cancel_reservation", loan_id}  (only before pickup)

require __DIR__ . '/../config/db.php';
require __DIR__ . '/../config/library_lib.php';
session_start();
session_write_close();   // we only read the session; don't block other requests
header('Content-Type: application/json; charset=utf-8');

function handleCatalog(PDO $pdo): void
{
    // E-BOOKS: hidden until e-book support exists (see SHOW_EBOOKS in library_lib.php).
    $catalogConditions = ['b.archived_at IS NULL'];   // archived books are hidden from students
    if (!SHOW_EBOOKS) {
        $catalogConditions[] = "b.format = 'Physical'";
    }
    $formatFilter = 'WHERE ' . implode(' AND ', $catalogConditions);

    $books = $pdo->query("
        SELECT b.book_id, b.isbn, b.title, b.author, b.publication_year, b.category,
               b.format, b.cover_image, b.copies_total,
               GREATEST(0, b.copies_total - COUNT(l.loan_id)) AS copies_available,
               (SELECT COUNT(*) FROM waitlist w
                 WHERE w.book_id = b.book_id AND w.fulfilled_at IS NULL AND w.cancelled_at IS NULL) AS waitlist_count
        FROM books b
        LEFT JOIN loans l ON l.book_id = b.book_id AND l.returned_at IS NULL
        $formatFilter
        GROUP BY b.book_id
        ORDER BY b.title ASC
    ")->fetchAll();

    $viewer = fetchSessionUser($pdo);
    $myBookStates = [];   // book_id => 'reserved' | 'borrowed' | 'waitlisted'

    if ($viewer && $viewer['role'] === 'student') {
        $loanStatement = $pdo->prepare(
            "SELECT book_id, IF(picked_up_at IS NULL, 'reserved', 'borrowed') AS state
             FROM loans WHERE user_id = ? AND returned_at IS NULL"
        );
        $loanStatement->execute([$viewer['user_id']]);
        foreach ($loanStatement->fetchAll() as $loanRow) {
            $myBookStates[$loanRow['book_id']] = $loanRow['state'];
        }

        $waitlistStatement = $pdo->prepare(
            'SELECT book_id FROM waitlist WHERE user_id = ? AND fulfilled_at IS NULL AND cancelled_at IS NULL'
        );
        $waitlistStatement->execute([$viewer['user_id']]);
        foreach ($waitlistStatement->fetchAll() as $waitlistRow) {
            $myBookStates[$waitlistRow['book_id']] = 'waitlisted';
        }
    }

    sendJson([
        'ok'         => true,
        'books'      => $books,
        'my_states'  => (object) $myBookStates,
        'viewer'     => $viewer ? [
            'name'  => $viewer['first_name'] . ' ' . $viewer['last_name'],
            'email' => $viewer['school_email'],
            'role'  => $viewer['role'],
        ] : null,
        'rules'      => ['loan_period_days' => LOAN_PERIOD_DAYS, 'pickup_window_days' => PICKUP_WINDOW_DAYS],
    ]);
}

function handleMyBooks(PDO $pdo): void
{
    $student = requireStudent($pdo);

    $loanStatement = $pdo->prepare("
        SELECT l.loan_id, l.book_id, b.title, b.author, l.borrowed_at, l.picked_up_at,
               l.pickup_deadline, l.due_date,
               CASE WHEN l.picked_up_at IS NULL THEN 'Reserved'
                    WHEN l.due_date < CURDATE() THEN 'Overdue'
                    ELSE 'Borrowed' END AS loan_status
        FROM loans l JOIN books b ON b.book_id = l.book_id
        WHERE l.user_id = ? AND l.returned_at IS NULL
        ORDER BY l.borrowed_at DESC
    ");
    $loanStatement->execute([$student['user_id']]);

    $waitlistStatement = $pdo->prepare("
        SELECT w.waitlist_id, w.book_id, b.title, b.author, w.joined_at,
               (SELECT COUNT(*) FROM waitlist w2
                 WHERE w2.book_id = w.book_id AND w2.fulfilled_at IS NULL AND w2.cancelled_at IS NULL
                   AND w2.waitlist_id <= w.waitlist_id) AS position
        FROM waitlist w JOIN books b ON b.book_id = w.book_id
        WHERE w.user_id = ? AND w.fulfilled_at IS NULL AND w.cancelled_at IS NULL
        ORDER BY w.joined_at ASC
    ");
    $waitlistStatement->execute([$student['user_id']]);

    sendJson([
        'ok'       => true,
        'loans'    => $loanStatement->fetchAll(),
        'waitlist' => $waitlistStatement->fetchAll(),
    ]);
}

function handleBorrow(PDO $pdo, array $requestBody): void
{
    $student = requireStudent($pdo);
    $bookId = (int) ($requestBody['book_id'] ?? 0);
    $studentId = (int) $student['user_id'];

    $pdo->beginTransaction();
    try {
        $book = $bookId ? lockBook($pdo, $bookId) : null;   // locks this book's row until commit
        if (!$book || $book['archived_at'] !== null) {
            $pdo->rollBack();
            failWith('This book is no longer available.', 404);
        }

        // Rule: one copy per unique title at a time (counts reservations, loans AND waitlist spots).
        $duplicateCheck = $pdo->prepare(
            'SELECT 1 FROM loans WHERE book_id = ? AND user_id = ? AND returned_at IS NULL
             UNION ALL
             SELECT 1 FROM waitlist WHERE book_id = ? AND user_id = ? AND fulfilled_at IS NULL AND cancelled_at IS NULL
             LIMIT 1'
        );
        $duplicateCheck->execute([$bookId, $studentId, $bookId, $studentId]);
        if ($duplicateCheck->fetchColumn()) {
            $pdo->rollBack();
            failWith('You already have this title reserved, borrowed, or on your waitlist.', 409);
        }

        promoteWaitlist($pdo, $bookId);   // hands any free copies to people already waiting first

        if (countFreeCopies($pdo, $bookId) > 0) {
            $pickupDeadline = createReservation($pdo, $bookId, $studentId);
            $pdo->commit();
            sendJson([
                'ok' => true, 'result' => 'reserved', 'title' => $book['title'],
                'pickup_deadline' => $pickupDeadline, 'loan_period_days' => LOAN_PERIOD_DAYS,
            ]);
        }

        $pdo->prepare('INSERT INTO waitlist (book_id, user_id) VALUES (?, ?)')->execute([$bookId, $studentId]);
        $waitlistId = (int) $pdo->lastInsertId();
        $positionStatement = $pdo->prepare(
            'SELECT COUNT(*) FROM waitlist WHERE book_id = ? AND fulfilled_at IS NULL AND cancelled_at IS NULL AND waitlist_id <= ?'
        );
        $positionStatement->execute([$bookId, $waitlistId]);
        $position = (int) $positionStatement->fetchColumn();
        $pdo->commit();

        sendJson(['ok' => true, 'result' => 'waitlisted', 'title' => $book['title'], 'position' => $position]);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function handleLeaveWaitlist(PDO $pdo, array $requestBody): void
{
    $student = requireStudent($pdo);
    $leaveStatement = $pdo->prepare(
        'UPDATE waitlist SET cancelled_at = NOW()
         WHERE book_id = ? AND user_id = ? AND fulfilled_at IS NULL AND cancelled_at IS NULL'
    );
    $leaveStatement->execute([(int) ($requestBody['book_id'] ?? 0), $student['user_id']]);
    if ($leaveStatement->rowCount() === 0) {
        failWith('You are not on the waitlist for that book.', 404);
    }
    sendJson(['ok' => true]);
}

function handleCancelReservation(PDO $pdo, array $requestBody): void
{
    $student = requireStudent($pdo);
    $loanId = (int) ($requestBody['loan_id'] ?? 0);

    $loanLookup = $pdo->prepare(
        'SELECT book_id FROM loans WHERE loan_id = ? AND user_id = ? AND picked_up_at IS NULL AND returned_at IS NULL'
    );
    $loanLookup->execute([$loanId, $student['user_id']]);
    $bookId = (int) $loanLookup->fetchColumn();
    if (!$bookId) {
        failWith('Reservation not found, or it was already picked up.', 404);
    }

    $pdo->beginTransaction();
    try {
        lockBook($pdo, $bookId);
        $pdo->prepare("UPDATE loans SET returned_at = NOW(), end_reason = 'cancelled' WHERE loan_id = ? AND returned_at IS NULL")
            ->execute([$loanId]);
        promoteWaitlist($pdo, $bookId);   // next student in line gets the copy
        $pdo->commit();
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
    sendJson(['ok' => true]);
}

try {
    releaseExpiredReservations($pdo);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? 'catalog';
        if ($action === 'catalog') { handleCatalog($pdo); }
        if ($action === 'my_books') { handleMyBooks($pdo); }
        failWith('Unknown action.', 400);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $requestBody = json_decode(file_get_contents('php://input'), true) ?: [];
        switch ($requestBody['action'] ?? '') {
            case 'borrow':             handleBorrow($pdo, $requestBody);
            case 'leave_waitlist':     handleLeaveWaitlist($pdo, $requestBody);
            case 'cancel_reservation': handleCancelReservation($pdo, $requestBody);
        }
        failWith('Unknown action.', 400);
    }

    failWith('Method not allowed.', 405);

} catch (Throwable $unexpectedError) {
    error_log($unexpectedError->getMessage());
    sendJson(['ok' => false, 'errors' => ['Server error. Please try again.']], 500);
}