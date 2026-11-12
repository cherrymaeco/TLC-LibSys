-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 12, 2026 at 09:55 AM
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
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`book_id`, `isbn`, `title`, `author`, `publication_year`, `category`, `format`, `copies_total`, `cover_image`, `archived_at`, `created_at`, `updated_at`, `description`) VALUES
(1, '1439149950', 'The Lessons of History', 'Ariel Durant and Will Durant', 1968, 'History, Biography & Geography', 'Physical', 1, 'assets/imgs/books/0a6e6ba8e201dc0a7e3b182ef20b25dc.jpg', NULL, '2026-11-12 00:00:00', '2026-11-12 15:14:39', 'In this illuminating and thoughtful book, Will and Ariel Durant have succeeded in distilling for the reader the accumulated store of knowledge and experience from their four decades of work on the ten monumental volumes of The Story of Civilization. The result is a survey of human history, full of dazzling insights into the nature of human experience, the evolution of civilization, the culture of man. With the completion of their life\'s work they look back and ask what history has to say about the nature, the conduct and the prospects of man, seeking in the great lives, the great ideas, the great events of the past for the meaning of man\'s long journey through war, conquest and creation -- and for the great themes that can help us to understand our own era. To the Durants, history is \"not merely a warning reminder of man\'s follies and crimes, but also an encouraging remembrance of generative souls ... a spacious country of the mind, wherein a thousand saints, statesmen, inventors, scientists, poets, artists, musicians, lovers, and philosophers still live and speak, teach and carve and sing ...\" Designed to accompany the ten-volume set of The Story of Civilization, The Lessons of History is, in its own right, a profound and original work of history and philosophy.'),
(2, '0877792932', 'The Merriam-Webster Dictionary', 'Merriam-Webster', 2020, 'Language', 'Physical', 1, 'assets/imgs/books/a169a69f60ad79e5b0f53303d008bc4a.jpg', NULL, '2026-11-12 00:00:00', '2026-11-12 15:13:50', 'More than 75,000 definitions and 8,000 usage examples aid understanding―and cover the words you need today. Includes pronunciations, word origins, and synonym lists. Features useful tables and special sections on Foreign Words & Phrases and Geographical Names'),
(3, '0877794065', 'Merriam-Webster\'s Collegiate Dictionary (Twelfth Edition)', 'Merriam-Webster', 2020, 'Language', 'Physical', 1, 'assets/imgs/books/25840db21285ddaf4a09129709a872ae.webp', NULL, '2026-11-12 00:00:00', '2026-11-12 15:13:11', 'A trusted language reference offering definitions, pronunciation guides, and comprehensive word entries for everyday and academic use.'),
(4, '0226458148', 'The Structure of Scientific Revolutions', 'Thomas S. Kuhn', 2012, 'Natural Sciences & Mathematics', 'Physical', 1, 'assets/imgs/books/13f4d6a4f9a46533b5bd8ca8ce465a6f.jpg', NULL, '2026-11-12 00:00:00', '2026-11-12 15:14:51', 'A good book may have the power to change the way we see the world, but a great book actually becomes part of our daily consciousness, pervading our thinking to the point that we take it for granted, and we forget how provocative and challenging its ideas once were—and still are. The Structure of Scientific Revolutions is that kind of book. When it was first published in 1962, it was a landmark event in the history and philosophy of science. Fifty years later, it still has many lessons to teach. With The Structure of Scientific Revolutions, Kuhn challenged long-standing linear notions of scientific progress, arguing that transformative ideas don\'t arise from the day-to-day, gradual process of experimentation and data accumulation but that the revolutions in science, those breakthrough moments that disrupt accepted thinking and offer unanticipated ideas, occur outside of \"normal science,\" as he called it. Though Kuhn was writing when physics ruled the sciences, his ideas on how scientific revolutions bring order to the anomalies that amass over time in research experiments are still instructive in our biotech age. This new edition of Kuhn\'s essential work in the history of science includes an insightful introduction by Ian Hacking, which clarifies terms popularized by Kuhn, including paradigm and incommensurability, and applies Kuhn\'s ideas to the science of today. Usefully keyed to the separate sections of the book, Hacking\'s introduction provides important background information as well as a contemporary context. Newly designed, with an expanded index, this edition will be eagerly welcomed by the next generation of readers seeking to understand the history of our perspectives on science.'),
(5, '0393253910', 'The Well-Educated Mind', 'Susan Wise Bauer', 2015, 'Generalities', 'Physical', 1, 'assets/imgs/books/9330fdaf12f9b6747a848fcdd36478b4.jpg', NULL, '2026-11-12 00:00:00', '2026-11-12 15:15:43', 'Newly expanded and updated to include standout works from the twenty-first century as well as essential readings in science (from the earliest works of Hippocrates to the discovery of the asteroid that killed the dinosaurs), The Well-Educated Mind offers brief, entertaining histories of six literary genres—fiction, autobiography, history, drama, poetry, and science—accompanied by detailed instructions on how to read each type. The annotated lists at the end of each chapter—ranging from Cervantes to Cormac McCarthy, Herodotus to Laurel Thatcher Ulrich, Aristotle to Stephen Hawking—preview recommended reading and encourage readers to make vital connections between ancient traditions and contemporary writing. The Well-Educated Mind reassures those readers who worry that they read too slowly or with below-average comprehension. If you can understand a daily newspaper, there\'s no reason you can\'t read and enjoy Shakespeare\'s sonnets or Jane Eyre. But no one should attempt to read the \"Great Books\" without a guide and a plan. Bauer will show you how to allocate time to reading on a regular basis; how to master difficult arguments; how to make personal and literary judgments about what you read; how to appreciate the resonant links among texts within a genre—what does Anna Karenina owe to Madame Bovary?—and also between genres.'),
(6, NULL, 'Understanding Life Through Science for Grade 1', 'Wilma Lyn N. Aldon, Javiez & Torres, PhD', 2015, 'Natural Sciences & Mathematics', 'Physical', 1, 'assets/imgs/books/c77786c70e522d1fcefdb80cc13d7be2.jpg', NULL, '2026-11-12 00:00:00', '2026-11-12 15:13:38', 'The book is structured to deepen the connection between fundamental science concepts and real-world scenarios, fostering early scientific literacy across environmental, technical, and engineering fields.'),
(7, '9781885008329', 'Cora Cooks Pancit', 'Dorina K. Lazo Gilmore', 2009, 'Fiction', 'Physical', 1, 'assets/imgs/books/989cb2b7af3ae6e38153fce4582008fb.jpg', NULL, '2026-11-12 00:00:00', '2026-11-12 15:12:12', 'Cora longs to help in the kitchen, but she\'s always told she\'s too little. When her chance finally comes, she learns about her family\'s Filipino heritage while making pancit. A warm story about family, culture, and gaining confidence in the kitchen.'),
(8, '1429096977', 'The Tale of Benjamin Bunny', 'Beatrix Potter', 1904, 'Fiction', 'Physical', 1, 'assets/imgs/books/13dd91b48bebb926c903715af7977b82.jpg', NULL, '2026-11-12 00:00:00', '2026-11-12 15:15:13', 'Peter Rabbit\'s cousin, Benjamin Bunny, has been a very popular character since this book\'s first publication in 1904. In this tale we hear all about his and Peter\'s adventures in Mr McGregor\'s vegetable garden, and what happens to them when they meet a cat! Even more frightening, is what happens to the two pesky bunnies when Old Mr Benjamin Bunny finds out what they have been up to!'),
(9, '9781984820709', 'The Tainted Cup', 'Robert Jackson Bennett', 2025, 'Fiction', 'Physical', 1, 'assets/imgs/books/3af44236c716a979a03ee2888c6f68bb.webp', NULL, '2026-11-12 00:00:00', '2026-11-12 15:15:00', 'A murder mystery set in a rich secondary world beset by leviathans and a terrifying contagion where plants take root within living humans. Dinios Kol, an apprentice with perfect memory, assists the brilliant and caustic investigator Ana Dolabra in solving a calculated assassination plot. Winner of the Hugo Award and World Fantasy Award.'),
(10, '1580377890', 'Discovering the World of Geography, Grades 7-8', 'Myrl Shireman', 2008, 'History, Biography & Geography', 'Physical', 1, 'assets/imgs/books/02b740167a3d236a02113f491a6b270c.jpg', NULL, '2026-11-12 00:00:00', '2026-11-12 15:12:31', 'Explore the world with students in grades 7–8 using Discovering the World of Geography. This 128-page book helps students use geographical knowledge and skills to interpret and analyze data. This text covers topics including population, political landscapes, climate, understanding developed and underdeveloped countries, and regions of conflict. The book presents information through activities such as maps, charts, diagrams, and graphs that support National Geography Standards. It also includes assessments and answer keys.');

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
  `end_reason` enum('returned','cancelled','expired','lost') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `loans`
--

INSERT INTO `loans` (`loan_id`, `book_id`, `user_id`, `borrowed_at`, `due_date`, `pickup_deadline`, `picked_up_at`, `returned_at`, `end_reason`) VALUES
(1, 1, 3, '2026-11-05 09:15:00', '2026-11-19', NULL, '2026-11-05 09:20:00', NULL, NULL),
(2, 4, 5, '2026-11-08 13:40:00', '2026-11-22', NULL, '2026-11-08 13:45:00', NULL, NULL),
(3, 7, 6, '2026-11-10 10:00:00', '2026-11-24', NULL, '2026-11-10 10:05:00', NULL, NULL),
(4, 9, 8, '2026-11-11 15:30:00', '2026-11-25', NULL, '2026-11-11 15:35:00', NULL, NULL),
(5, 2, 4, '2026-10-20 08:30:00', '2026-11-03', NULL, '2026-10-20 08:35:00', '2026-11-02 16:10:00', 'returned'),
(6, 3, 7, '2026-10-25 11:45:00', '2026-11-08', NULL, '2026-10-25 11:50:00', '2026-11-07 14:20:00', 'returned'),
(7, 8, 9, '2026-10-28 09:00:00', '2026-11-11', NULL, '2026-10-28 09:05:00', '2026-11-11 10:00:00', 'returned'),
(8, 5, 3, '2026-11-11 18:00:00', '2026-11-25', '2026-11-13', NULL, NULL, NULL),
(9, 6, 5, '2026-11-12 07:45:00', '2026-11-26', '2026-11-14', NULL, NULL, NULL),
(10, 10, 6, '2026-11-09 16:20:00', '2026-11-23', '2026-11-10', NULL, '2026-11-09 18:30:00', 'cancelled'),
(11, 1, 4, '2026-10-30 10:10:00', '2026-11-13', '2026-11-01', NULL, '2026-11-02 00:00:00', 'expired'),
(12, 7, 9, '2026-10-10 14:00:00', '2026-10-24', NULL, '2026-10-10 14:05:00', '2026-11-05 09:30:00', 'lost');

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
(1, 'Admin', NULL, 'Account', '09000000000', 'admin@email.com', NULL, NULL, '$2y$10$shSJGVpxN58mioWlwVHzIuh.xMbbHBsOT8WkFszjnMTQt0iS6rRc.', 'bcrypt', 'admin', 1, '2026-11-12 16:33:09', '2026-11-04 12:59:33', '2026-11-12 16:33:09'),
(3, 'John', NULL, 'Doe', '09611515153', 'example@gmail.com', 'BSIT', 1, '$2y$10$nq0sQxqEG5jiccFEIZpFMu/Ep/NgojGKeXK.AbRs4oVjOIw9W7CDe', 'bcrypt', 'student', 1, '2026-11-12 16:33:00', '2026-11-04 13:17:56', '2026-11-12 16:33:00'),
(4, 'Juan', NULL, 'De la Cruz', '09546546546', 'juan@email.com', 'BEED', 2, '$2y$10$nq0sQxqEG5jiccFEIZpFMu/Ep/NgojGKeXK.AbRs4oVjOIw9W7CDe', 'bcrypt', 'student', 1, '2026-11-11 20:50:22', '2026-11-11 20:38:38', '2026-11-12 16:09:34'),
(5, 'Maria', 'Santos', 'Reyes', '09171234501', 'maria.reyes@email.com', 'BSIT', 2, '$2y$10$nq0sQxqEG5jiccFEIZpFMu/Ep/NgojGKeXK.AbRs4oVjOIw9W7CDe', 'bcrypt', 'student', 1, '2026-11-12 16:10:12', '2026-11-12 08:20:00', '2026-11-12 16:10:12'),
(6, 'Jose', 'Protacio', 'Mercado', '09181234502', 'jose.mercado@email.com', 'BSBA', 3, '$2y$10$nq0sQxqEG5jiccFEIZpFMu/Ep/NgojGKeXK.AbRs4oVjOIw9W7CDe', 'bcrypt', 'student', 1, NULL, '2026-11-12 08:20:00', '2026-11-12 16:09:47'),
(7, 'Andrea', 'Cruz', 'Bautista', '09191234503', 'andrea.bautista@email.com', 'BEED', 1, '$2y$10$nq0sQxqEG5jiccFEIZpFMu/Ep/NgojGKeXK.AbRs4oVjOIw9W7CDe', 'bcrypt', 'student', 1, NULL, '2026-11-12 08:20:00', '2026-11-12 16:09:50'),
(8, 'Mark', 'Villanueva', 'Aquino', '09201234504', 'mark.aquino@email.com', 'ACT', 2, '$2y$10$nq0sQxqEG5jiccFEIZpFMu/Ep/NgojGKeXK.AbRs4oVjOIw9W7CDe', 'bcrypt', 'student', 1, NULL, '2026-11-12 08:20:00', '2026-11-12 16:09:52'),
(9, 'Liza', 'Ramos', 'Dela Cruz', '09211234505', 'liza.delacruz@email.com', 'BSIT', 4, '$2y$10$nq0sQxqEG5jiccFEIZpFMu/Ep/NgojGKeXK.AbRs4oVjOIw9W7CDe', 'bcrypt', 'student', 1, NULL, '2026-11-12 08:20:00', '2026-11-12 16:09:56');

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
-- Dumping data for table `waitlist`
--

INSERT INTO `waitlist` (`waitlist_id`, `book_id`, `user_id`, `joined_at`, `fulfilled_at`, `cancelled_at`) VALUES
(2, 7, 3, '2026-11-12 15:32:07', NULL, NULL);

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
  MODIFY `book_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `loans`
--
ALTER TABLE `loans`
  MODIFY `loan_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `waitlist`
--
ALTER TABLE `waitlist`
  MODIFY `waitlist_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- Constraints for table `waitlist`
--
ALTER TABLE `waitlist`
  ADD CONSTRAINT `fk_waitlist_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_waitlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
