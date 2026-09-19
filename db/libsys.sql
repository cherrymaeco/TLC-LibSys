-- ============================================================
-- LIBRARY MANAGEMENT SYSTEM
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS library_system
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE library_system;

-- ============================================================
-- 1. USERS (Librarians + Students in ONE table)
-- ============================================================
CREATE TABLE users (
    user_id         INT AUTO_INCREMENT PRIMARY KEY,
    school_id       VARCHAR(20)  UNIQUE,          -- Student ID / Employee ID
    first_name      VARCHAR(50)  NOT NULL,
    last_name       VARCHAR(50)  NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,        -- Use password_hash() in PHP!
    role            ENUM('librarian','student') NOT NULL DEFAULT 'student',
    grade_level     VARCHAR(20)  NULL,            -- e.g. "Grade 10", NULL for librarians
    phone           VARCHAR(20)  NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. CATEGORIES (Normalized - don't store as plain text)
-- ============================================================
CREATE TABLE categories (
    category_id     INT AUTO_INCREMENT PRIMARY KEY,
    category_name   VARCHAR(50) NOT NULL UNIQUE
);

-- ============================================================
-- 3. BOOKS (Each row = ONE title, quantity handles copies)
-- ============================================================
CREATE TABLE books (
    book_id         INT AUTO_INCREMENT PRIMARY KEY,
    isbn            VARCHAR(20)  UNIQUE,
    title           VARCHAR(255) NOT NULL,
    author          VARCHAR(255) NOT NULL,
    category_id     INT          NULL,
    publisher       VARCHAR(150) NULL,
    publish_year    YEAR         NULL,
    quantity_total  INT          NOT NULL DEFAULT 1,  -- Total copies owned
    quantity_available INT       NOT NULL DEFAULT 1,  -- Copies currently on shelf
    status          ENUM('available','unavailable','archived') 
                    NOT NULL DEFAULT 'available',
    is_ebook        BOOLEAN      NOT NULL DEFAULT FALSE,  -- For Google Books API
    ebook_url       VARCHAR(500) NULL,                    -- Google Books link
    cover_image     VARCHAR(500) NULL,
    description     TEXT         NULL,
    is_archived     BOOLEAN      NOT NULL DEFAULT FALSE,  -- Soft delete
    added_by        INT          NULL,                    -- Librarian who added it
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (added_by)    REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_title  (title),
    INDEX idx_author (author),
    INDEX idx_isbn   (isbn)
);

-- ============================================================
-- 4. BORROW RECORDS (One row = one borrowing transaction)
-- ============================================================
CREATE TABLE borrow_records (
    borrow_id       INT AUTO_INCREMENT PRIMARY KEY,
    book_id         INT NOT NULL,
    user_id         INT NOT NULL,                 -- The student
    issued_by       INT NULL,                     -- Librarian who processed it
    borrowed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date        DATETIME NOT NULL,
    returned_at     DATETIME NULL,                -- NULL = still borrowed
    status          ENUM('active','returned','overdue','lost') 
                    NOT NULL DEFAULT 'active',
    fine_amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    remarks         VARCHAR(255) NULL,
    
    FOREIGN KEY (book_id)   REFERENCES books(book_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_book_status (book_id, status),
    INDEX idx_due_date    (due_date)
);

-- ============================================================
-- 5. WAITLIST (FIFO queue per book)
-- ============================================================
CREATE TABLE waitlist (
    waitlist_id     INT AUTO_INCREMENT PRIMARY KEY,
    book_id         INT NOT NULL,
    user_id         INT NOT NULL,
    position        INT NOT NULL,                 -- 1 = first in line
    added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at     DATETIME NULL,                -- When we told them "it's available"
    status          ENUM('waiting','notified','fulfilled','cancelled') 
                    NOT NULL DEFAULT 'waiting',
    
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_waitlist (book_id, user_id),  -- Can't join same waitlist twice
    INDEX idx_book_position (book_id, position)
);

-- ============================================================
-- 6. NOTIFICATIONS (So students know when book is ready)
-- ============================================================
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    title           VARCHAR(150) NOT NULL,
    message         TEXT NOT NULL,
    type            ENUM('waitlist','due_reminder','overdue','system') 
                    NOT NULL DEFAULT 'system',
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, is_read)
);

-- ============================================================
-- 7. ACTIVITY LOG (Optional - for your admin history view)
-- ============================================================
CREATE TABLE activity_log (
    log_id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NULL,
    action          VARCHAR(100) NOT NULL,        -- e.g. "ADD_BOOK", "BORROW"
    target_table    VARCHAR(50)  NULL,
    target_id       INT          NULL,
    details         TEXT         NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);