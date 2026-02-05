-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 05, 2026 at 01:50 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

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
  `pages` int(11) DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `category`, `price`, `is_free`, `cover_url`, `book_url`, `pages`) VALUES
(1, 'The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 0.00, 1, 'https://placehold.co/400x600/1c1b29/ff8906?text=The+Gatsby', 'https://www.gutenberg.org/files/64317/64317-h/64317-h.htm', 100),
(2, '1984', 'George Orwell', 'Fiction', 14.99, 0, 'https://placehold.co/400x600/1c1b29/f25f4c?text=1984', '#', 100),
(3, 'Sapiens', 'Yuval Noah Harari', 'Non-Fiction', 18.99, 0, 'https://placehold.co/400x600/1c1b29/ff8906?text=Sapiens', '#', 100),
(4, 'Alice in Wonderland', 'Lewis Carroll', 'Fantasy', 0.00, 1, 'https://placehold.co/400x600/1c1b29/f25f4c?text=Alice', 'https://www.gutenberg.org/files/11/11-h/11-h.htm', 100),
(5, 'Atomic Habits', 'James Clear', 'Self-Help', 15.50, 0, 'https://placehold.co/400x600/1c1b29/ff8906?text=Habits', '#', 100),
(6, 'Sherlock Holmes', 'Arthur Conan Doyle', 'Mystery', 0.00, 1, 'https://placehold.co/400x600/1c1b29/f25f4c?text=Sherlock', 'https://www.gutenberg.org/files/1661/1661-h/1661-h.htm', 100),
(7, 'Deep Work', 'Cal Newport', 'Self-Help', 12.00, 0, 'https://placehold.co/400x600/1c1b29/ff8906?text=Deep+Work', '#', 100),
(8, 'The Alchemist', 'Paulo Coelho', 'Fantasy', 11.99, 0, 'https://placehold.co/400x600/1c1b29/f25f4c?text=Alchemist', '#', 100);

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
(2, 'meet12@gmail.com', 'Membership: 1 Month', 499.00, '2026-02-05 18:10:56', 'success');

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
  `role` varchar(20) DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `membership_plan`, `start_date`, `end_date`, `role`) VALUES
(1, 'JohnDoe', 'john@example.com', 'password123', 'free', NULL, NULL, 'user'),
(2, 'JanePremium', 'jane@premium.com', 'securepass', 'free', NULL, NULL, 'user'),
(3, 'mit12', 'mit12@gmail.com', 'Mit@123', 'free', NULL, NULL, 'user'),
(4, 'parth', 'parth12@gmail.com', 'Parth@123', 'free', NULL, NULL, 'user'),
(5, 'dixit12', 'dixit12@gmail.com', 'Dixit@123', '1 Month', '2026-02-05 12:08:36', '2026-03-07 12:10:36', 'user'),
(6, 'vansh12', 'vansh12@gmail.com', 'Vansh@123', '1 Month', '2026-02-05 17:50:39', '2026-03-07 17:50:39', 'user'),
(7, 'Master Admin', 'admin@bookhaven.com', 'admin123', 'pro', NULL, NULL, 'admin'),
(8, 'meet12', 'meet12@gmail.com', 'Meet@123', '1 Month', '2026-02-05 18:10:56', '2026-03-07 18:10:56', 'user');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `books`
--
ALTER TABLE `books`
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
