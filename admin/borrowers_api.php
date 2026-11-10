<?php
// admin/borrowers_api.php — loans overview + pickup / return / cancel for the admin Borrowers tab.
//   GET -> every loan (reserved, borrowed, overdue, returned, cancelled, expired)
//   PUT -> { "loan_id": 5, "action": "pickup" | "return" | "cancel" }   ("return" is the default)

require __DIR__ . '/../config/db.php';
require __DIR__ . '/../config/library_lib.php';
session_start();
header('Content-Type: application/json; charset=utf-8');

const REQUIRE_ADMIN = true;
if (REQUIRE_ADMIN) {
    requireAdminSession($pdo);   // reads the user from the DB, same idea as books_api.php
}

try {
    releaseExpiredReservations($pdo);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $loansQuery = "
            SELECT l.loan_id, l.borrowed_at AS reserved_at, l.picked_up_at, l.pickup_deadline,
                   l.due_date, l.returned_at,
                   b.title AS book_title, b.author AS book_author, b.isbn,
                   CONCAT(u.first_name, ' ', u.last_name) AS borrower_name,
                   u.school_email AS borrower_email, u.course, u.year_level,
                   CASE
                       WHEN l.returned_at IS NOT NULL THEN
                           CASE l.end_reason WHEN 'cancelled' THEN 'Cancelled'
                                             WHEN 'expired'   THEN 'Expired'
                                             ELSE 'Returned' END
                       WHEN l.picked_up_at IS NULL THEN 'Reserved'
                       WHEN l.due_date < CURDATE()  THEN 'Overdue'
                       ELSE 'Borrowed'
                   END AS loan_status
            FROM loans l
            JOIN books b ON b.book_id = l.book_id
            JOIN users u ON u.user_id = l.user_id
            ORDER BY (l.returned_at IS NULL) DESC, l.due_date ASC";
        sendJson(['ok' => true, 'loans' => $pdo->query($loansQuery)->fetchAll()]);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $requestBody = json_decode(file_get_contents('php://input'), true) ?: [];
        $loanId = (int) ($requestBody['loan_id'] ?? 0);
        $action = $requestBody['action'] ?? 'return';

        $loanLookup = $pdo->prepare('SELECT book_id FROM loans WHERE loan_id = ? AND returned_at IS NULL');
        $loanLookup->execute([$loanId]);
        $bookId = (int) $loanLookup->fetchColumn();
        if (!$bookId) {
            failWith('Loan not found or already closed.', 404);
        }

        $pdo->beginTransaction();
        try {
            lockBook($pdo, $bookId);

            if ($action === 'pickup') {
                // The loan period starts when the student physically takes the book.
                $change = $pdo->prepare(
                    'UPDATE loans SET picked_up_at = NOW(), due_date = ?
                     WHERE loan_id = ? AND picked_up_at IS NULL AND returned_at IS NULL'
                );
                $change->execute([dateFromToday(LOAN_PERIOD_DAYS), $loanId]);
            } elseif ($action === 'return') {
                $change = $pdo->prepare(
                    "UPDATE loans SET returned_at = NOW(), end_reason = 'returned'
                     WHERE loan_id = ? AND picked_up_at IS NOT NULL AND returned_at IS NULL"
                );
                $change->execute([$loanId]);
            } elseif ($action === 'cancel') {
                $change = $pdo->prepare(
                    "UPDATE loans SET returned_at = NOW(), end_reason = 'cancelled'
                     WHERE loan_id = ? AND picked_up_at IS NULL AND returned_at IS NULL"
                );
                $change->execute([$loanId]);
            } else {
                $pdo->rollBack();
                failWith('Unknown action.', 400);
            }

            if ($change->rowCount() === 0) {
                $pdo->rollBack();
                failWith('That action does not apply to this loan in its current state.', 409);
            }
            if ($action !== 'pickup') {
                promoteWaitlist($pdo, $bookId);   // a copy was freed: next student in line gets it
            }
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) { $pdo->rollBack(); }
            throw $error;
        }
        sendJson(['ok' => true]);
    }

    failWith('Method not allowed.', 405);

} catch (Throwable $unexpectedError) {
    error_log($unexpectedError->getMessage());
    sendJson(['ok' => false, 'errors' => ['Server error. Please try again.']], 500);
}
