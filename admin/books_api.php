<?php
require __DIR__ . '/../config/db.php'; 
session_start();
require __DIR__ . '/../config/library_lib.php';   

header('Content-Type: application/json; charset=utf-8');

const REQUIRE_ADMIN_FOR_CHANGES = true;

const ALLOWED_CATEGORIES = [
    'Generalities', 'Fiction', 'Non-Fiction', 'Philosophy & Psychology',
    'Religion', 'Social Sciences', 'Language', 'Natural Sciences & Mathematics',
    'Technology', 'Arts & Recreation', 'Literature', 'History, Biography & Geography',
];
const ALLOWED_FORMATS = ['Physical', 'E-Book'];

function sendJson(array $payload, int $httpStatus = 200): void
{
    http_response_code($httpStatus);
    echo json_encode($payload);
    exit;
}

function readRequestBody(): array
{
    if (str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data')) {
        return $_POST;
    }
    $decodedBody = json_decode(file_get_contents('php://input'), true);
    return is_array($decodedBody) ? $decodedBody : [];
}

function saveCoverImage(?string $currentImage): ?string
{
    $image = $_FILES['cover_image'] ?? null;
    if ($image === null || $image['error'] === UPLOAD_ERR_NO_FILE) {
        return $currentImage;
    }
    if ($image['error'] !== UPLOAD_ERR_OK) {
        sendJson(['ok' => false, 'errors' => ['The cover image could not be uploaded.']], 400);
    }
    if ($image['size'] > 5 * 1024 * 1024) {
        sendJson(['ok' => false, 'errors' => ['The cover image must be 5 MB or smaller.']], 422);
    }

    $imageInfo = getimagesize($image['tmp_name']);
    $imageTypes = [
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG => 'png',
        IMAGETYPE_WEBP => 'webp',
    ];
    if ($imageInfo === false || !isset($imageTypes[$imageInfo[2]])) {
        sendJson(['ok' => false, 'errors' => ['Choose a JPG, PNG, or WebP image.']], 422);
    }

    $uploadDirectory = __DIR__ . '/../assets/imgs/books';
    if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0755, true) && !is_dir($uploadDirectory)) {
        throw new RuntimeException('Could not create the book cover upload directory.');
    }

    $fileName = bin2hex(random_bytes(16)) . '.' . $imageTypes[$imageInfo[2]];
    $destination = $uploadDirectory . '/' . $fileName;
    if (!move_uploaded_file($image['tmp_name'], $destination)) {
        throw new RuntimeException('Could not save the uploaded book cover.');
    }

    return 'assets/imgs/books/' . $fileName;
}

function removeCoverImage(?string $coverImage): void
{
    if ($coverImage === null || !preg_match('#^assets/imgs/books/[a-f0-9]{32}\.(?:jpg|png|webp)$#', $coverImage)) {
        return;
    }
    $imagePath = __DIR__ . '/../' . $coverImage;
    if (is_file($imagePath) && !unlink($imagePath)) {
        error_log('Could not remove book cover image: ' . $imagePath);
    }
}

function requireAdmin(PDO $pdo): void
{
    if (!REQUIRE_ADMIN_FOR_CHANGES) {
        return;
    }

    $userId = filter_var($_SESSION['user_id'] ?? null, FILTER_VALIDATE_INT);
    if ($userId === false || $userId === null) {
        sendJson(['ok' => false, 'error' => 'Your session has expired. Sign in again.'], 401);
    }

    $statement = $pdo->prepare('SELECT role, is_active FROM users WHERE user_id = ? LIMIT 1');
    $statement->execute([$userId]);
    $user = $statement->fetch();
    if (!$user || !$user['is_active']) {
        sendJson(['ok' => false, 'error' => 'This account is inactive or no longer exists.'], 403);
    }
    if ($user['role'] !== 'admin') {
        sendJson(['ok' => false, 'error' => 'This account does not have an admin role. Sign in with an admin account to manage books.'], 403);
    }

    $_SESSION['role'] = $user['role'];
}

function validateBookInput(array $rawInput): array
{
    $errors = [];
    $currentYear = (int) date('Y');

    $title    = trim((string) ($rawInput['title'] ?? ''));
    $author   = trim((string) ($rawInput['author'] ?? ''));
    $category = trim((string) ($rawInput['category'] ?? ''));
    $format   = trim((string) ($rawInput['format'] ?? 'Physical'));
    $isbn     = preg_replace('/[\s-]/', '', (string) ($rawInput['isbn'] ?? ''));
    $year     = filter_var($rawInput['publication_year'] ?? null, FILTER_VALIDATE_INT);

    $copiesTotal = filter_var($rawInput['copies_total'] ?? 1, FILTER_VALIDATE_INT);
    if ($copiesTotal === false || $copiesTotal < 1 || $copiesTotal > 999) {
        $errors[] = 'Copies must be a number from 1 to 999.';
    }

    if ($title === '')  { $errors[] = 'Title is required.'; }
    if ($author === '') { $errors[] = 'Author is required.'; }
    if ($year === false || $year < 1000 || $year > $currentYear) {
        $errors[] = "Year must be a 4-digit year up to $currentYear.";
    }
    if (!in_array($category, ALLOWED_CATEGORIES, true)) { $errors[] = 'Please choose a valid category.'; }
    if (!in_array($format, ALLOWED_FORMATS, true))      { $errors[] = 'Format must be Physical or E-Book.'; }
    if ($isbn !== '' && !preg_match('/^(\d{9}[\dX]|\d{13})$/i', $isbn)) {
        $errors[] = 'ISBN must be 10 or 13 characters.';
    }

    $description = trim((string) ($rawInput['description'] ?? ''));
    if (mb_strlen($description) > 2000) { $errors[] = 'Description must be 2000 characters or fewer.'; }

    $cleanedBook = [
        'isbn'             => $isbn === '' ? null : strtoupper($isbn),
        'title'            => $title,
        'author'           => $author,
        'publication_year' => $year,
        'category'         => $category,
        'format'           => $format,
        'copies_total'     => $copiesTotal,
        'description'      => $description === '' ? null : $description,
    ];
    return [$cleanedBook, $errors];
}

function bookHasActiveLoan(PDO $pdo, int $bookId): bool
{
    $statement = $pdo->prepare('SELECT 1 FROM loans WHERE book_id = ? AND returned_at IS NULL LIMIT 1');
    $statement->execute([$bookId]);
    return (bool) $statement->fetchColumn();
}

function bookExists(PDO $pdo, int $bookId): bool
{
    $statement = $pdo->prepare('SELECT 1 FROM books WHERE book_id = ?');
    $statement->execute([$bookId]);
    return (bool) $statement->fetchColumn();
}

function bookIsArchived(PDO $pdo, int $bookId): bool
{
    $statement = $pdo->prepare('SELECT 1 FROM books WHERE book_id = ? AND archived_at IS NOT NULL');
    $statement->execute([$bookId]);
    return (bool) $statement->fetchColumn();
}

/** Students still in line for this title. */
function bookHasWaitingStudents(PDO $pdo, int $bookId): bool
{
    $statement = $pdo->prepare(
        'SELECT 1 FROM waitlist WHERE book_id = ? AND fulfilled_at IS NULL AND cancelled_at IS NULL LIMIT 1'
    );
    $statement->execute([$bookId]);
    return (bool) $statement->fetchColumn();
}

function handleDuplicateIsbn(PDOException $exception): void
{
    if ($exception->getCode() === '23000') {
        sendJson(['ok' => false, 'errors' => ['A book with that ISBN already exists (it may be in the archive).']], 409);
    }
    throw $exception;
}

$requestMethod = $_POST['_method'] ?? $_SERVER['REQUEST_METHOD'];

try {
    // ---------- READ ----------
    if ($requestMethod === 'GET') {
        // archived=1 shows the archive. Default shows active books.
        $showArchived = ($_GET['archived'] ?? '') === '1';
        if ($showArchived) {
            requireAdmin($pdo);
        }
        $archiveFilter = $showArchived ? 'b.archived_at IS NOT NULL' : 'b.archived_at IS NULL';
        $listQuery = "
            SELECT b.book_id, b.isbn, b.title, b.author, b.publication_year,
                b.category, b.format, b.cover_image, b.copies_total, b.archived_at, b.description,
                (SELECT COUNT(*) FROM waitlist w WHERE w.book_id = b.book_id
                  AND w.fulfilled_at IS NULL AND w.cancelled_at IS NULL) AS waitlist_count,
                COUNT(l.loan_id)                      AS copies_borrowed,
                b.copies_total - COUNT(l.loan_id)     AS copies_available,
                IF(b.copies_total - COUNT(l.loan_id) > 0, 'Available', 'Borrowed') AS status
            FROM books b
            LEFT JOIN loans l ON l.book_id = b.book_id AND l.returned_at IS NULL
            WHERE $archiveFilter
            GROUP BY b.book_id
            ORDER BY b.title ASC";
        sendJson(['ok' => true, 'books' => $pdo->query($listQuery)->fetchAll()]);
    }

    requireAdmin($pdo);
    $requestBody = readRequestBody();

    // ---------- CREATE ----------
    if ($requestMethod === 'POST') {
        [$newBook, $validationErrors] = validateBookInput($requestBody);
        if ($validationErrors) {
            sendJson(['ok' => false, 'errors' => $validationErrors], 422);
        }
        $newBook['cover_image'] = saveCoverImage(null);
        try {
            $insertStatement = $pdo->prepare(
                'INSERT INTO books (isbn, title, author, publication_year, category, format, copies_total, cover_image, description)
                 VALUES (:isbn, :title, :author, :publication_year, :category, :format, :copies_total, :cover_image, :description)'
            );
            $insertStatement->execute($newBook);
        } catch (PDOException $exception) {
            removeCoverImage($newBook['cover_image']);
            handleDuplicateIsbn($exception);
        } catch (Throwable $exception) {
            removeCoverImage($newBook['cover_image']);
            throw $exception;
        }
        sendJson(['ok' => true, 'book_id' => (int) $pdo->lastInsertId()], 201);
    }

    // ---------- UPDATE ----------
    if ($requestMethod === 'PUT') {
        $bookId = (int) ($requestBody['book_id'] ?? 0);
        if (!$bookId || !bookExists($pdo, $bookId)) {
            sendJson(['ok' => false, 'errors' => ['Book not found.']], 404);
        }
        // Restore a book from the archive:
        if (($requestBody['action'] ?? '') === 'restore') {
            $pdo->prepare('UPDATE books SET archived_at = NULL WHERE book_id = ?')->execute([$bookId]);
            sendJson(['ok' => true]);
        }
        if (bookIsArchived($pdo, $bookId)) {
            sendJson(['ok' => false, 'errors' => ['This book is archived. Restore it before editing.']], 409);
        }
        [$updatedBook, $validationErrors] = validateBookInput($requestBody);
        if ($validationErrors) {
            sendJson(['ok' => false, 'errors' => $validationErrors], 422);
        }
        $borrowedCountStatement = $pdo->prepare(
            'SELECT COUNT(*) FROM loans WHERE book_id = ? AND returned_at IS NULL'
        );
        $borrowedCountStatement->execute([$bookId]);
        if ($updatedBook['copies_total'] < (int) $borrowedCountStatement->fetchColumn()) {
            sendJson(['ok' => false, 'errors' => ['Copies cannot be fewer than the number currently borrowed.']], 422);
        }
        $existingImageQuery = $pdo->prepare('SELECT cover_image FROM books WHERE book_id = ?');
        $existingImageQuery->execute([$bookId]);
        $oldCoverImage = $existingImageQuery->fetchColumn() ?: null;
        $updatedBook['cover_image'] = saveCoverImage($oldCoverImage);
        $updatedBook['book_id'] = $bookId;
        try {
            $updateStatement = $pdo->prepare(
                'UPDATE books SET isbn = :isbn, title = :title, author = :author,
                        publication_year = :publication_year, category = :category, format = :format,
                        copies_total = :copies_total,
                        cover_image = :cover_image, description = :description
                 WHERE book_id = :book_id'
            );
            $updateStatement->execute($updatedBook);
        } catch (PDOException $exception) {
            if ($updatedBook['cover_image'] !== $oldCoverImage) {
                removeCoverImage($updatedBook['cover_image']);
            }
            handleDuplicateIsbn($exception);
        } catch (Throwable $exception) {
            if ($updatedBook['cover_image'] !== $oldCoverImage) {
                removeCoverImage($updatedBook['cover_image']);
            }
            throw $exception;
        }
        if ($updatedBook['cover_image'] !== $oldCoverImage) {
            removeCoverImage($oldCoverImage);
        }
        // If the admin added copies, students waiting in line get them now.
        $pdo->beginTransaction();
        lockBook($pdo, $bookId);
        promoteWaitlist($pdo, $bookId);
        $pdo->commit();
        sendJson(['ok' => true]);
    }

    // ---------- ARCHIVE ----------
    if ($requestMethod === 'DELETE') {
        $bookId = (int) ($requestBody['book_id'] ?? 0);
        if (!$bookId || !bookExists($pdo, $bookId)) {
            sendJson(['ok' => false, 'errors' => ['Book not found.']], 404);
        }
        if (bookIsArchived($pdo, $bookId)) {
            sendJson(['ok' => false, 'errors' => ['This book is already archived.']], 409);
        }
        if (bookHasActiveLoan($pdo, $bookId)) {   // covers reserved AND borrowed copies
            sendJson(['ok' => false, 'errors' => ['A copy of this book is reserved or borrowed. Archive it after all copies are back.']], 409);
        }
        if (bookHasWaitingStudents($pdo, $bookId)) {
            sendJson(['ok' => false, 'errors' => ['Students are on the waitlist for this book, so it cannot be archived yet.']], 409);
        }
        $pdo->prepare('UPDATE books SET archived_at = NOW() WHERE book_id = ?')->execute([$bookId]);
        sendJson(['ok' => true]);
    }

    sendJson(['ok' => false, 'errors' => ['Method not allowed.']], 405);

} catch (Throwable $unexpectedError) {
    error_log($unexpectedError->getMessage());
    sendJson(['ok' => false, 'errors' => ['Server error. Please try again.']], 500);
}