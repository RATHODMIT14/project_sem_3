-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 19, 2026 at 04:41 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `elibrary`
--

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `author` varchar(100) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `is_free` tinyint(1) DEFAULT 0,
  `cover_url` varchar(255) DEFAULT NULL,
  `book_url` varchar(255) DEFAULT NULL,
  `pages` int(11) DEFAULT 100,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `category`, `price`, `is_free`, `cover_url`, `book_url`, `pages`, `description`) VALUES
(1, 'The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 0.00, 1, 'https://placehold.co/400x600/1c1b29/ff8906?text=The+Gatsby', 'https://www.gutenberg.org/files/64317/64317-h/64317-h.htm', 100, NULL),
(2, '1984', 'George Orwell', 'Fiction', 14.99, 0, 'https://placehold.co/400x600/1c1b29/f25f4c?text=1984', '#', 100, NULL),
(3, 'Sapiens', 'Yuval Noah Harari', 'Non-Fiction', 18.99, 0, 'https://placehold.co/400x600/1c1b29/ff8906?text=Sapiens', '#', 100, NULL),
(4, 'Alice in Wonderland', 'Lewis Carroll', 'Fantasy', 0.00, 1, 'https://placehold.co/400x600/1c1b29/f25f4c?text=Alice', 'https://www.gutenberg.org/files/11/11-h/11-h.htm', 100, NULL),
(5, 'Atomic Habits', 'James Clear', 'Self-Help', 15.50, 0, 'https://placehold.co/400x600/1c1b29/ff8906?text=Habits', 'C:\\Users\\91973\\OneDrive\\Pictures\\MITUL\'S document\\E_LIBRARY\\el\\books\\dracula.pdf', 100, NULL),
(6, 'Sherlock Holmes', 'Arthur Conan Doyle', 'Mystery', 0.00, 1, 'https://placehold.co/400x600/1c1b29/f25f4c?text=Sherlock', 'https://www.gutenberg.org/files/1661/1661-h/1661-h.htm', 100, NULL),
(7, 'Deep Work', 'Cal Newport', 'Self-Help', 12.00, 1, 'https://placehold.co/400x600/1c1b29/ff8906?text=Deep+Work', 'C:\\xampp\\htdocs\\e-lib\\books\\red_olenders.pdf', 100, NULL),
(8, 'The Alchemist', 'Paulo Coelho', 'Fantasy', 11.99, 0, 'https://placehold.co/400x600/1c1b29/f25f4c?text=Alchemist', '', 100, NULL),
(9, 'Red oleanders', 'Rabindranath Tagore', NULL, 300.00, 0, 'C:\\xampp\\htdocs\\e-lib\\books\\pg77892-h\\images\\cover.jpg', 'C:\\xampp\\htdocs\\e-lib\\books\\red_olenders.pdf', 100, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `carousel_slides`
--

CREATE TABLE `carousel_slides` (
  `id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `item_name` varchar(255) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `transaction_date` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'success'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `user_email`, `item_name`, `amount`, `transaction_date`, `status`) VALUES
(1, 'vansh12@gmail.com', 'Membership: 1 Month', 499.00, '2026-02-05 17:50:39', 'success'),
(2, 'meet12@gmail.com', 'Membership: 1 Month', 499.00, '2026-02-05 18:10:56', 'success'),
(3, 'mit12@gmail.com', 'Membership: 1 Month', 499.00, '2026-02-10 15:04:04', 'success'),
(4, 'ultimatemoments18@gmail.com', 'Books Purchase', 2199.00, '2026-02-18 00:44:09', 'success'),
(5, 'ultimatemoments18@gmail.com', 'Books Purchase', 2718.00, '2026-02-18 00:55:45', 'success'),
(6, 'ultimatemoments18@gmail.com', 'Books Purchase', 1199.00, '2026-02-18 01:09:09', 'success'),
(7, 'ultimatemoments18@gmail.com', 'Atomic Habits', 0.00, '2026-02-18 10:30:20', 'success'),
(8, 'ultimatemoments18@gmail.com', 'Books Purchase', 1240.00, '2026-02-18 10:30:20', 'success'),
(9, 'ultimatemoments18@gmail.com', 'Sapiens', 0.00, '2026-02-18 10:40:35', 'success'),
(10, 'ultimatemoments18@gmail.com', 'Books Purchase', 1519.00, '2026-02-18 10:40:35', 'success'),
(11, 'dixitp1311@gmail.com', 'Membership: 1 Month', 499.00, '2026-02-18 11:17:43', 'success'),
(12, 'ultimatemoments18@gmail.com', 'The Alchemist', 0.00, '2026-02-18 11:55:54', 'success'),
(13, 'ultimatemoments18@gmail.com', 'Books Purchase', 959.00, '2026-02-18 11:55:54', 'success'),
(14, 'ultimatemoments18@gmail.com', '1984', 0.00, '2026-02-18 23:57:54', 'success'),
(15, 'ultimatemoments18@gmail.com', 'Books Purchase', 1199.00, '2026-02-18 23:57:54', 'success'),
(16, 'ultimatemoments18@gmail.com', 'Red oleanders', 0.00, '2026-02-19 00:29:34', 'success'),
(17, 'ultimatemoments18@gmail.com', 'Books Purchase', 24000.00, '2026-02-19 00:29:34', 'success');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `membership_plan` varchar(50) DEFAULT 'free',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `role` varchar(20) DEFAULT 'user',
  `otp` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `membership_plan`, `start_date`, `end_date`, `role`, `otp`) VALUES
(1, 'JohnDoe', 'john@example.com', 'password123', 'free', NULL, NULL, 'user', NULL),
(2, 'JanePremium', 'jane@premium.com', 'securepass', 'free', NULL, NULL, 'user', NULL),
(3, 'mit12', 'mit12@gmail.com', 'Mit@123', '1 Month', '2026-02-10 15:04:04', '2026-03-12 15:04:04', 'user', NULL),
(4, 'parth', 'parth12@gmail.com', 'Parth@123', '1 Month', NULL, NULL, 'user', NULL),
(5, 'dixit12', 'dixit12@gmail.com', 'Dixit@123', '1 Month', '2026-02-05 12:08:36', '2026-03-07 12:10:36', 'user', NULL),
(6, 'vansh12', 'vansh12@gmail.com', 'Vansh@123', '1 Month', '2026-02-05 17:50:39', '2026-03-07 17:50:39', 'user', NULL),
(7, 'Master Admin', 'admin@bookhaven.com', '$2b$10$wpS25FQGhjFQzZOfjR0l9OycMJW3XIAW474PLuHvUg/8chVVAl7GG', 'pro', NULL, NULL, 'admin', NULL),
(8, 'meet12', 'meet12@gmail.com', 'Meet@123', '1 Month', '2026-02-05 18:10:56', '2026-03-07 18:10:56', 'user', NULL),
(9, 'rathodmit123', 'ultimatemoments18@gmail.com', '$2b$10$/1F0pcGmzaYhLN2U824BEODnSMDCyrh0ALXpIiz0MhEiq3paqUdEe', 'free', '2026-02-19 00:29:34', NULL, 'user', NULL),
(10, 'dhruvi12', 'dshah300906@gmail.com', 'Dhruvi@123', 'free', NULL, NULL, 'user', NULL),
(11, 'Dixit1311', 'dixitp1311@gmail.com', 'Dixit@1311', '1 Month', '2026-02-18 11:17:43', '2026-03-20 11:17:43', 'user', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `carousel_slides`
--
ALTER TABLE `carousel_slides`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `carousel_slides`
--
ALTER TABLE `carousel_slides`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
