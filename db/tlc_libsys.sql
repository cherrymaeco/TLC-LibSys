-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 11, 2026 at 12:49 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tlc_libsys`
--

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `book_id` int(10) UNSIGNED NOT NULL,
  `isbn` varchar(13) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `author` varchar(255) NOT NULL,
  `publication_year` smallint(5) UNSIGNED NOT NULL,
  `category` varchar(60) NOT NULL,
  `format` enum('Physical','E-Book') NOT NULL DEFAULT 'Physical',
  `copies_total` smallint(5) UNSIGNED NOT NULL DEFAULT 1,
  `cover_image` varchar(255) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`book_id`, `isbn`, `title`, `author`, `publication_year`, `category`, `format`, `copies_total`, `cover_image`, `archived_at`, `created_at`, `updated_at`) VALUES
(1, '1531351531534', 'afdwf', 'adawdad', 2000, 'Literature', 'Physical', 3, NULL, NULL, '2026-11-04 17:33:16', '2026-11-08 13:21:21'),
(4, '1518686448664', 'fawfwa', 'adawdad', 2020, 'Social Sciences', 'Physical', 1, NULL, NULL, '2026-11-04 17:56:13', '2026-11-08 10:37:02'),
(6, '1954354354351', 'idk', 'adawdad', 2001, 'History, Biography & Geography', 'Physical', 3, NULL, NULL, '2026-11-08 13:17:37', '2026-11-09 21:40:46');

-- --------------------------------------------------------

--
-- Table structure for table `loans`
--

CREATE TABLE `loans` (
  `loan_id` int(10) UNSIGNED NOT NULL,
  `book_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `borrowed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `due_date` date NOT NULL,
  `pickup_deadline` date DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `returned_at` datetime DEFAULT NULL,
  `end_reason` enum('returned','cancelled','expired') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `loans`
--

INSERT INTO `loans` (`loan_id`, `book_id`, `user_id`, `borrowed_at`, `due_date`, `pickup_deadline`, `picked_up_at`, `returned_at`, `end_reason`) VALUES
(1, 4, 3, '2026-11-09 21:13:12', '2026-11-18', '2026-11-11', '2026-11-11 16:36:40', '2026-11-11 16:36:46', 'returned'),
(3, 6, 3, '2026-11-01 16:44:53', '2026-11-08', '2026-11-03', NULL, '2026-11-11 16:45:41', 'expired'),
(4, 6, 3, '2026-11-11 16:51:25', '2026-11-20', '2026-11-13', NULL, NULL, NULL),
(5, 4, 3, '2026-11-02 16:51:38', '2026-11-09', '2026-11-04', '2026-11-11 16:52:28', NULL, NULL),
(6, 1, 3, '2026-11-11 16:51:41', '2026-11-20', '2026-11-13', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `reset_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone_number` char(11) NOT NULL,
  `school_email` varchar(100) NOT NULL,
  `course` enum('BSIT','BEED','ACT','BSBA') DEFAULT NULL,
  `year_level` tinyint(3) UNSIGNED DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `password_algo` varchar(20) NOT NULL DEFAULT 'bcrypt',
  `role` enum('student','admin') NOT NULL DEFAULT 'student',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `first_name`, `middle_name`, `last_name`, `phone_number`, `school_email`, `course`, `year_level`, `password_hash`, `password_algo`, `role`, `is_active`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'Admin', NULL, 'Account', '09000000000', 'admin@email.com', NULL, NULL, '$2y$10$shSJGVpxN58mioWlwVHzIuh.xMbbHBsOT8WkFszjnMTQt0iS6rRc.', 'bcrypt', 'admin', 1, '2026-11-11 17:40:04', '2026-11-04 12:59:33', '2026-11-11 17:40:04'),
(3, 'John', NULL, 'Doe', '09611515153', 'example@gmail.com', 'BSIT', 1, '$2y$10$nq0sQxqEG5jiccFEIZpFMu/Ep/NgojGKeXK.AbRs4oVjOIw9W7CDe', 'bcrypt', 'student', 1, '2026-11-11 16:51:20', '2026-11-04 13:17:56', '2026-11-11 16:51:20');

-- --------------------------------------------------------

--
-- Table structure for table `waitlist`
--

CREATE TABLE `waitlist` (
  `waitlist_id` int(10) UNSIGNED NOT NULL,
  `book_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `joined_at` datetime NOT NULL DEFAULT current_timestamp(),
  `fulfilled_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`book_id`),
  ADD UNIQUE KEY `uq_books_isbn` (`isbn`),
  ADD KEY `idx_books_title` (`title`),
  ADD KEY `idx_books_archived` (`archived_at`);

--
-- Indexes for table `loans`
--
ALTER TABLE `loans`
  ADD PRIMARY KEY (`loan_id`),
  ADD KEY `idx_loans_book` (`book_id`,`returned_at`),
  ADD KEY `idx_loans_user` (`user_id`,`returned_at`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`reset_id`),
  ADD UNIQUE KEY `uq_reset_token` (`token_hash`),
  ADD KEY `idx_reset_user` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `uq_users_email` (`school_email`),
  ADD UNIQUE KEY `uq_users_phone` (`phone_number`),
  ADD KEY `idx_users_name` (`last_name`,`first_name`);

--
-- Indexes for table `waitlist`
--
ALTER TABLE `waitlist`
  ADD PRIMARY KEY (`waitlist_id`),
  ADD KEY `idx_waitlist_book` (`book_id`,`fulfilled_at`,`cancelled_at`,`waitlist_id`),
  ADD KEY `idx_waitlist_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `book_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `loans`
--
ALTER TABLE `loans`
  MODIFY `loan_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `reset_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `waitlist`
--
ALTER TABLE `waitlist`
  MODIFY `waitlist_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `loans`
--
ALTER TABLE `loans`
  ADD CONSTRAINT `fk_loans_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`),
  ADD CONSTRAINT `fk_loans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `fk_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `waitlist`
--
ALTER TABLE `waitlist`
  ADD CONSTRAINT `fk_waitlist_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_waitlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
