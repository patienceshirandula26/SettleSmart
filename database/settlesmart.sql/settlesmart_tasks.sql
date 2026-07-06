-- MySQL dump 10.13  Distrib 8.0.46, for macos15 (arm64)
--
-- Host: localhost    Database: settlesmart
-- ------------------------------------------------------
-- Server version	9.7.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '060ccaa2-7928-11f1-b09f-fa425c060818:1-17';

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `task_id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `task_name` varchar(150) NOT NULL,
  `description` text,
  `estimated_time` varchar(50) DEFAULT NULL,
  `official_link` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`task_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,1,'Apply for USI','Create your Unique Student Identifier','10 minutes',NULL),(2,1,'Collect Student ID','Collect your university student ID card','15 minutes',NULL),(3,2,'Apply for TFN','Apply for a Tax File Number','15 minutes',NULL),(4,2,'Open Bank Account','Open an Australian bank account','30 minutes',NULL),(5,2,'Receive Bank Card','Collect your debit card','7 days',NULL),(6,3,'Purchase Go Card','Buy a Go Card for public transport','10 minutes',NULL),(7,3,'Verify International Driver Licence','Check if your overseas licence can be used','20 minutes',NULL),(8,4,'Activate OSHC','Check and activate your Overseas Student Health Cover','15 minutes',NULL),(9,5,'Upload Rental Agreement','Store your rental agreement','10 minutes',NULL),(10,6,'Apply for Blue Card','If required for employment','20 minutes',NULL),(11,6,'Apply for Yellow Card','NDIS Worker Screening if required','20 minutes',NULL),(12,6,'Apply for Red Card','Construction industry induction if required','20 minutes',NULL),(13,7,'Purchase Australian SIM Card','Buy and activate a SIM card','20 minutes',NULL),(14,8,'Create Resume','Prepare an Australian-style resume','1 hour',NULL),(15,8,'Create LinkedIn Profile','Create or update LinkedIn','45 minutes',NULL),(16,1,'Apply for USI','Create your Unique Student Identifier','10 minutes',NULL),(17,1,'Collect Student ID','Collect your university student ID card','15 minutes',NULL),(18,2,'Apply for TFN','Apply for a Tax File Number','15 minutes',NULL),(19,2,'Open Bank Account','Open an Australian bank account','30 minutes',NULL),(20,2,'Receive Bank Card','Collect your debit card','7 days',NULL),(21,3,'Purchase Go Card','Buy a Go Card for public transport','10 minutes',NULL),(22,3,'Verify International Driver Licence','Check if your overseas licence can be used','20 minutes',NULL),(23,4,'Activate OSHC','Check and activate your Overseas Student Health Cover','15 minutes',NULL),(24,5,'Upload Rental Agreement','Store your rental agreement','10 minutes',NULL),(25,6,'Apply for Blue Card','If required for employment','20 minutes',NULL),(26,6,'Apply for Yellow Card','NDIS Worker Screening if required','20 minutes',NULL),(27,6,'Apply for Red Card','Construction industry induction if required','20 minutes',NULL),(28,7,'Purchase Australian SIM Card','Buy and activate a SIM card','20 minutes',NULL),(29,8,'Create Resume','Prepare an Australian-style resume','1 hour',NULL),(30,8,'Create LinkedIn Profile','Create or update LinkedIn','45 minutes',NULL),(31,1,'Apply for USI','Create your Unique Student Identifier','10 minutes',NULL),(32,1,'Collect Student ID','Collect your university student ID card','15 minutes',NULL),(33,2,'Apply for TFN','Apply for a Tax File Number','15 minutes',NULL),(34,2,'Open Bank Account','Open an Australian bank account','30 minutes',NULL),(35,2,'Receive Bank Card','Collect your debit card','7 days',NULL),(36,3,'Purchase Go Card','Buy a Go Card for public transport','10 minutes',NULL),(37,3,'Verify International Driver Licence','Check if your overseas licence can be used','20 minutes',NULL),(38,4,'Activate OSHC','Check and activate your Overseas Student Health Cover','15 minutes',NULL),(39,5,'Upload Rental Agreement','Store your rental agreement','10 minutes',NULL),(40,6,'Apply for Blue Card','If required for employment','20 minutes',NULL),(41,6,'Apply for Yellow Card','NDIS Worker Screening if required','20 minutes',NULL),(42,6,'Apply for Red Card','Construction industry induction if required','20 minutes',NULL),(43,7,'Purchase Australian SIM Card','Buy and activate a SIM card','20 minutes',NULL),(44,8,'Create Resume','Prepare an Australian-style resume','1 hour',NULL),(45,8,'Create LinkedIn Profile','Create or update LinkedIn','45 minutes',NULL);
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-06 23:18:43
