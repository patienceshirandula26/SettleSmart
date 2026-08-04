-- ==========================================================
-- SettleSmart — database schema and reference data
--
-- Recreate the whole database from scratch:
--   mysql -u root -p < database/settlesmart_schema.sql
--
-- Or let the setup script build and update it for you:
--   python3 backend/init_db.py
--
-- Student accounts and their tasks, documents, reminders and
-- activity are created by the application, so they are not
-- included here.
-- ==========================================================

CREATE DATABASE IF NOT EXISTS settlesmart
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE settlesmart;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_log` (
  `activity_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`activity_id`),
  KEY `fk_activity_user` (`user_id`),
  CONSTRAINT `fk_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  `description` text,
  `emoji` varchar(10) DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents` (
  `document_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `document_name` varchar(150) NOT NULL,
  `document_type` varchar(100) DEFAULT NULL,
  `status` enum('Pending','Completed','Not Required') DEFAULT 'Pending',
  `reference_number` varchar(100) DEFAULT NULL,
  `provider` varchar(100) DEFAULT NULL,
  `notes` text,
  `file_name` varchar(255) DEFAULT NULL,
  `stored_name` varchar(255) DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(120) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `uploaded_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_id`),
  KEY `fk_documents_user` (`user_id`),
  CONSTRAINT `fk_documents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reminders` (
  `reminder_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `reminder_date` date NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `notes` text,
  `is_done` tinyint(1) NOT NULL DEFAULT '0',
  `task_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reminder_id`),
  KEY `fk_reminders_user` (`user_id`),
  CONSTRAINT `fk_reminders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resources` (
  `resource_id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `resource_name` varchar(150) NOT NULL,
  `description` text,
  `official_link` varchar(255) DEFAULT NULL,
  `emoji` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`resource_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `resources_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tasks` (
  `task_id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `task_name` varchar(150) NOT NULL,
  `description` text,
  `estimated_time` varchar(50) DEFAULT NULL,
  `official_link` varchar(255) DEFAULT NULL,
  `priority` enum('High','Medium','Low') NOT NULL DEFAULT 'Medium',
  `due_offset_days` int NOT NULL DEFAULT '30',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`task_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_settings` (
  `user_id` int NOT NULL,
  `email_notifications` tinyint(1) NOT NULL DEFAULT '1',
  `sms_reminders` tinyint(1) NOT NULL DEFAULT '1',
  `push_notifications` tinyint(1) NOT NULL DEFAULT '0',
  `language` varchar(50) NOT NULL DEFAULT 'English (Australia)',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_tasks` (
  `user_task_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `task_id` int NOT NULL,
  `status` enum('Not Started','In Progress','Completed') DEFAULT 'Not Started',
  `completed_date` date DEFAULT NULL,
  `notes` text,
  `due_date` date DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_task_id`),
  UNIQUE KEY `uq_user_task` (`user_id`,`task_id`),
  KEY `fk_user_tasks_task` (`task_id`),
  CONSTRAINT `fk_user_tasks_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_tasks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=340 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `university` varchar(100) DEFAULT NULL,
  `arrival_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `phone` varchar(30) DEFAULT NULL,
  `home_country` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


-- ---------- Reference data ----------


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Identity & Study','Student ID, USI, passport and visa documents','?',1),(2,'Financial','TFN, bank account, bank card and money setup','?',2),(3,'Transport & Licensing','Go Card and international driver licence verification','?',3),(4,'Health','OSHC details and emergency contacts','?',4),(5,'Accommodation','Rental documents, bond and housing setup','?',5),(6,'Work Clearances','Blue Card, Yellow Card and Red Card if required','?',6),(7,'Communication','Australian SIM card and mobile number setup','?',7),(8,'Employment','Resume, LinkedIn and job-ready documents','?',8);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,1,'Apply for USI','Create your Unique Student Identifier','10 minutes','https://www.usi.gov.au/','High',7,1),(2,1,'Collect Student ID','Collect your university student ID card','15 minutes',NULL,'Medium',14,2),(3,2,'Apply for TFN','Apply for a Tax File Number','15 minutes','https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn','High',7,1),(4,2,'Open Bank Account','Open an Australian bank account','30 minutes',NULL,'High',10,2),(5,2,'Receive Bank Card','Collect your debit card','7 days',NULL,'Medium',21,3),(6,3,'Purchase Go Card','Buy a Go Card for public transport','10 minutes','https://translink.com.au/tickets-and-fares/go-card','Medium',10,1),(7,3,'Verify International Driver Licence','Check if your overseas licence can be used','20 minutes','https://www.qld.gov.au/transport/licensing/driver-licences/overseas-licences','Low',60,2),(8,4,'Activate OSHC','Check and activate your Overseas Student Health Cover','15 minutes','https://www.studyaustralia.gov.au/en/plan-your-studies/overseas-student-health-cover-oshc','High',5,1),(9,5,'Upload Rental Agreement','Store a copy of your rental agreement','10 minutes',NULL,'Medium',21,1),(10,6,'Apply for Blue Card','If required for child-related employment','20 minutes','https://www.qld.gov.au/law/laws-regulated-industries-and-accountability/queensland-laws-and-regulations/regulated-industries-and-licensing/blue-card','Low',45,1),(11,6,'Apply for Yellow Card','NDIS Worker Screening if required','20 minutes','https://www.workerscreening.qld.gov.au/','Low',45,2),(12,6,'Apply for Red Card','Construction industry induction if required','20 minutes',NULL,'Low',45,3),(13,7,'Purchase Australian SIM Card','Buy and activate an Australian SIM card','20 minutes',NULL,'High',3,1),(14,8,'Create Resume','Prepare an Australian-style resume','1 hour',NULL,'Medium',30,1),(15,8,'Create LinkedIn Profile','Create or update your LinkedIn profile','45 minutes',NULL,'Low',40,2),(16,1,'Organise Passport & Visa Copies','Keep digital and physical copies of both','15 minutes',NULL,'High',3,3),(17,4,'Set Up Emergency Contacts','Save local emergency and university contacts','10 minutes',NULL,'Medium',14,2),(18,5,'Set Up Home Internet','Arrange internet at your accommodation','30 minutes',NULL,'Low',30,2),(19,2,'Set Up Superannuation','Open a super account before you start working','30 minutes',NULL,'Medium',45,4);
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `resources` WRITE;
/*!40000 ALTER TABLE `resources` DISABLE KEYS */;
INSERT INTO `resources` VALUES (1,1,'Unique Student Identifier','Official website for creating or finding a USI number.','https://www.usi.gov.au/','?'),(2,2,'Australian Taxation Office - TFN','Official website for applying for a Tax File Number.','https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn','?️'),(3,3,'Translink Go Card','Official information for Go Card public transport setup in Queensland.','https://translink.com.au/tickets-and-fares/go-card','?'),(4,3,'Queensland Overseas Licence Information','Information about using or verifying an overseas driver licence in Queensland.','https://www.qld.gov.au/transport/licensing/driver-licences/overseas-licences','?'),(5,6,'Blue Card Services','Official Queensland Government information for Blue Card applications.','https://www.qld.gov.au/law/laws-regulated-industries-and-accountability/queensland-laws-and-regulations/regulated-industries-and-licensing/blue-card','?'),(6,6,'NDIS Worker Screening','Official Queensland Worker Screening information for disability-related work.','https://www.workerscreening.qld.gov.au/','?'),(7,4,'OSHC Information','Overseas Student Health Cover explained for international students.','https://www.studyaustralia.gov.au/en/plan-your-studies/overseas-student-health-cover-oshc','?'),(8,4,'Medicare / Services Australia','Health services and payments available in Australia.','https://www.servicesaustralia.gov.au/medicare','?'),(9,1,'Department of Home Affairs','Check your visa conditions, working hours and reporting duties.','https://www.homeaffairs.gov.au','?'),(10,8,'Study Queensland','Student support, events and job-readiness programs in Queensland.','https://studyqueensland.qld.gov.au','?'),(11,5,'Queensland Residential Tenancies Authority','Your rights as a renter, bond lodgement and dispute help.','https://www.rta.qld.gov.au/','?'),(12,7,'Australian Communications Guide','Comparing Australian mobile and internet providers.','https://www.accc.gov.au/consumers/internet-and-phone','?');
/*!40000 ALTER TABLE `resources` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

