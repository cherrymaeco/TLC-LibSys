<?php
// config/library_lib.php — borrowing rules + helpers shared by the student and admin APIs.
date_default_timezone_set('Asia/Manila');

// ---------- Library rules (change these numbers to change the policy) ----------
const LOAN_PERIOD_DAYS   = 7;   // how long a student keeps a book, counted from pickup day
const PICKUP_WINDOW_DAYS = 2;   // how long a reserved copy is held at the library desk

// E-BOOKS: disabled for now. Set to true once e-book borrowing/preview is built.
const SHOW_EBOOKS = false;

if (!function_exists('sendJson')) {
    function sendJson(array $payload, int $httpStatus = 200): void
    {
        http_response_code($httpStatus);
        echo json_encode($payload);
        exit;
    }
}

function failWith(string $message, int $httpStatus): void
{
    sendJson(['ok' => false, 'errors' => [$message]], $httpStatus);
}

function dateFromToday(int $days): string
{
    return date('Y-m-d', strtotime("+$days days"));
}

// ---------- Who is logged in? ----------
function fetchSessionUser(PDO $pdo): ?array
{
    $userId = filter_var($_SESSION['user_id'] ?? null, FILTER_VALIDATE_INT);
    if (!$userId) {
        return null;
    }
    $statement = $pdo->prepare(
        'SELECT user_id, first_name, last_name, school_email, role, is_active FROM users WHERE user_id = ? LIMIT 1'
    );
    $statement->execute([$userId]);
    $user = $statement->fetch();
    return ($user && $user['is_active']) ? $user : null;
}

function requireStudent(PDO $pdo): array
{
    $user = fetchSessionUser($pdo);
    if (!$user) {
        failWith('Please sign in to continue.', 401);
    }
    if ($user['role'] !== 'student') {
        failWith('Only student accounts can borrow books.', 403);
    }
    return $user;
}

function requireAdminSession(PDO $pdo): array
{
    $user = fetchSessionUser($pdo);
    if (!$user) {
        failWith('Your session has expired. Sign in again.', 401);
    }
    if ($user['role'] !== 'admin') {
        failWith('Admin access required.', 403);
    }
    return $user;
}

// ---------- Copies, reservations, waitlist ----------
// Call these inside a transaction after lockBook(), so two students can't grab the same last copy.

function lockBook(PDO $pdo, int $bookId): ?array
{
    $statement = $pdo->prepare('SELECT book_id, title, copies_total, archived_at FROM books WHERE book_id = ? FOR UPDATE');
    $statement->execute([$bookId]);
    return $statement->fetch() ?: null;
}

/** Copies not currently reserved or borrowed. */
function countFreeCopies(PDO $pdo, int $bookId): int
{
    $statement = $pdo->prepare(
        'SELECT b.copies_total - (SELECT COUNT(*) FROM loans l WHERE l.book_id = b.book_id AND l.returned_at IS NULL)
         FROM books b WHERE b.book_id = ?'
    );
    $statement->execute([$bookId]);
    return max(0, (int) $statement->fetchColumn());
}

/** Holds a copy for the student at the library desk. Returns the pickup deadline. */
function createReservation(PDO $pdo, int $bookId, int $userId): string
{
    $pickupDeadline = dateFromToday(PICKUP_WINDOW_DAYS);
    $tentativeDueDate = dateFromToday(PICKUP_WINDOW_DAYS + LOAN_PERIOD_DAYS); // reset when picked up
    $pdo->prepare('INSERT INTO loans (book_id, user_id, due_date, pickup_deadline) VALUES (?, ?, ?, ?)')
        ->execute([$bookId, $userId, $tentativeDueDate, $pickupDeadline]);
    return $pickupDeadline;
}

/** Gives free copies to the people waiting, first come first served. */
function promoteWaitlist(PDO $pdo, int $bookId): int
{
    $promotedCount = 0;
    while (countFreeCopies($pdo, $bookId) > 0) {
        $nextInLine = $pdo->prepare(
            'SELECT waitlist_id, user_id FROM waitlist
             WHERE book_id = ? AND fulfilled_at IS NULL AND cancelled_at IS NULL
             ORDER BY waitlist_id ASC LIMIT 1'
        );
        $nextInLine->execute([$bookId]);
        $waitingStudent = $nextInLine->fetch();
        if (!$waitingStudent) {
            break;
        }
        createReservation($pdo, $bookId, (int) $waitingStudent['user_id']);
        $pdo->prepare('UPDATE waitlist SET fulfilled_at = NOW() WHERE waitlist_id = ?')
            ->execute([$waitingStudent['waitlist_id']]);
        $promotedCount++;
    }
    return $promotedCount;
}

/**
 * Reservations nobody picked up in time go back on the shelf (and to the next student in line).
 * Runs at the start of each request, so no cron job is needed.
 */
function releaseExpiredReservations(PDO $pdo): void
{
    $expiredLoans = $pdo->query(
        'SELECT loan_id, book_id FROM loans
         WHERE returned_at IS NULL AND picked_up_at IS NULL AND pickup_deadline < CURDATE()'
    )->fetchAll();

    foreach ($expiredLoans as $expiredLoan) {
        $pdo->beginTransaction();
        try {
            lockBook($pdo, (int) $expiredLoan['book_id']);
            $expireStatement = $pdo->prepare(
                "UPDATE loans SET returned_at = NOW(), end_reason = 'expired'
                 WHERE loan_id = ? AND returned_at IS NULL AND picked_up_at IS NULL"
            );
            $expireStatement->execute([$expiredLoan['loan_id']]);
            if ($expireStatement->rowCount() > 0) {
                promoteWaitlist($pdo, (int) $expiredLoan['book_id']);
            }
            $pdo->commit();
        } catch (Throwable $error) {
            $pdo->rollBack();
            throw $error;
        }
    }
}
?>