<?php
require __DIR__ . '/../config/db.php';
require __DIR__ . '/../config/library_lib.php';
session_start();
session_write_close();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$admin = requireAdminSession($pdo);

try {
    releaseExpiredReservations($pdo);
    $action = $_GET['action'] ?? 'dashboard';

    if ($action === 'me') {
        sendJson(['ok' => true, 'name' => $admin['first_name'] . ' ' . $admin['last_name'], 'email' => $admin['school_email']]);
    }

    if ($action === 'waitlist') {
        $bookId = (int) ($_GET['book_id'] ?? 0);
        $waitlistStatement = $pdo->prepare("
            SELECT w.waitlist_id, w.joined_at,
                   CONCAT(u.first_name, ' ', u.last_name) AS student_name,
                   u.school_email AS student_email, u.course, u.year_level
            FROM waitlist w JOIN users u ON u.user_id = w.user_id
            WHERE w.book_id = ? AND w.fulfilled_at IS NULL AND w.cancelled_at IS NULL
            ORDER BY w.waitlist_id ASC
        ");
        $waitlistStatement->execute([$bookId]);
        $titleStatement = $pdo->prepare('SELECT title FROM books WHERE book_id = ?');
        $titleStatement->execute([$bookId]);
        sendJson(['ok' => true, 'title' => $titleStatement->fetchColumn() ?: '', 'entries' => $waitlistStatement->fetchAll()]);
    }

    if ($action === 'dashboard') {
        $totalUsers   = (int) $pdo->query('SELECT COUNT(*) FROM users WHERE is_active = 1')->fetchColumn();
        $totalStudents = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE is_active = 1 AND role = 'student'")->fetchColumn();
        $totalTitles  = (int) $pdo->query('SELECT COUNT(*) FROM books WHERE archived_at IS NULL')->fetchColumn();
        $totalCopies  = (int) $pdo->query('SELECT COALESCE(SUM(copies_total), 0) FROM books WHERE archived_at IS NULL')->fetchColumn();
        $copiesOut    = (int) $pdo->query(
            'SELECT COUNT(*) FROM loans l JOIN books b ON b.book_id = l.book_id
             WHERE l.returned_at IS NULL AND b.archived_at IS NULL'
        )->fetchColumn();
        $availableTitles = (int) $pdo->query(
            'SELECT COUNT(*) FROM (
                 SELECT b.book_id FROM books b
                 LEFT JOIN loans l ON l.book_id = b.book_id AND l.returned_at IS NULL
                 WHERE b.archived_at IS NULL
                 GROUP BY b.book_id, b.copies_total HAVING b.copies_total - COUNT(l.loan_id) > 0
             ) available_books'
        )->fetchColumn();

        $overdueBorrowers = $pdo->query("
            SELECT l.loan_id, CONCAT(u.first_name, ' ', u.last_name) AS borrower_name,
                   u.school_email AS borrower_email, b.title AS book_title, l.due_date,
                   DATEDIFF(CURDATE(), l.due_date) AS days_overdue
            FROM loans l
            JOIN users u ON u.user_id = l.user_id
            JOIN books b ON b.book_id = l.book_id
            WHERE l.picked_up_at IS NOT NULL AND l.returned_at IS NULL AND l.due_date < CURDATE()
            ORDER BY l.due_date ASC
        ")->fetchAll();

        // Requests = students who asked for a book and are waiting on it.
        $pendingPickups = $pdo->query("
            SELECT l.loan_id, CONCAT(u.first_name, ' ', u.last_name) AS borrower_name,
                   b.title AS book_title, l.borrowed_at AS reserved_at, l.pickup_deadline
            FROM loans l
            JOIN users u ON u.user_id = l.user_id
            JOIN books b ON b.book_id = l.book_id
            WHERE l.picked_up_at IS NULL AND l.returned_at IS NULL
            ORDER BY l.pickup_deadline ASC
        ")->fetchAll();

        $waitingStudents = $pdo->query("
            SELECT w.waitlist_id, CONCAT(u.first_name, ' ', u.last_name) AS student_name,
                   b.title AS book_title, w.joined_at,
                   (SELECT COUNT(*) FROM waitlist w2
                     WHERE w2.book_id = w.book_id AND w2.fulfilled_at IS NULL AND w2.cancelled_at IS NULL
                       AND w2.waitlist_id <= w.waitlist_id) AS position
            FROM waitlist w
            JOIN users u ON u.user_id = w.user_id
            JOIN books b ON b.book_id = w.book_id
            WHERE w.fulfilled_at IS NULL AND w.cancelled_at IS NULL
            ORDER BY b.title ASC, w.waitlist_id ASC
        ")->fetchAll();

        sendJson([
            'ok' => true,
            'stats' => [
                'total_users'      => $totalUsers,
                'total_students'   => $totalStudents,
                'total_titles'     => $totalTitles,
                'available_titles' => $availableTitles,
                'total_copies'     => $totalCopies,
                'available_copies' => max(0, $totalCopies - $copiesOut),
                'overdue_count'    => count($overdueBorrowers),
                'pickup_count'     => count($pendingPickups),
                'waitlist_count'   => count($waitingStudents),
            ],
            'overdue'         => $overdueBorrowers,
            'pending_pickups' => $pendingPickups,
            'waitlist'        => $waitingStudents,
        ]);
    }

    failWith('Unknown action.', 400);

} catch (Throwable $unexpectedError) {
    error_log($unexpectedError->getMessage());
    sendJson(['ok' => false, 'errors' => ['Server error. Please try again.']], 500);
}
