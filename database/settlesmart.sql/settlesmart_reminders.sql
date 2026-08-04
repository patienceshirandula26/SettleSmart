
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

LOCK TABLES `reminders` WRITE;
/*!40000 ALTER TABLE `reminders` DISABLE KEYS */;
INSERT INTO `reminders` VALUES (1,1,'Purchase Australian SIM Card','2026-08-07','Communication',NULL,0,13,'2026-08-04 06:03:12'),(2,1,'Activate OSHC','2026-08-09','Health',NULL,0,8,'2026-08-04 06:03:12'),(3,1,'Apply for USI','2026-08-11','Identity & Study',NULL,0,1,'2026-08-04 06:03:12'),(4,1,'Apply for TFN','2026-08-11','Financial',NULL,0,3,'2026-08-04 06:03:12'),(5,2,'Purchase Australian SIM Card','2026-08-07','Communication',NULL,0,13,'2026-08-04 06:03:12'),(6,2,'Activate OSHC','2026-08-09','Health',NULL,0,8,'2026-08-04 06:03:12'),(7,2,'Apply for USI','2026-08-11','Identity & Study',NULL,0,1,'2026-08-04 06:03:12'),(8,2,'Apply for TFN','2026-08-11','Financial',NULL,0,3,'2026-08-04 06:03:12'),(9,3,'Purchase Australian SIM Card','2026-08-07','Communication',NULL,0,13,'2026-08-04 06:03:12'),(10,3,'Activate OSHC','2026-08-09','Health',NULL,0,8,'2026-08-04 06:03:12'),(11,3,'Apply for USI','2026-08-11','Identity & Study',NULL,0,1,'2026-08-04 06:03:12'),(12,3,'Apply for TFN','2026-08-11','Financial',NULL,0,3,'2026-08-04 06:03:12'),(13,4,'Purchase Australian SIM Card','2026-08-07','Communication',NULL,0,13,'2026-08-04 06:03:12'),(14,4,'Activate OSHC','2026-08-09','Health',NULL,0,8,'2026-08-04 06:03:12'),(15,4,'Apply for USI','2026-08-11','Identity & Study',NULL,0,1,'2026-08-04 06:03:12'),(16,4,'Apply for TFN','2026-08-11','Financial',NULL,0,3,'2026-08-04 06:03:12'),(17,5,'Purchase Australian SIM Card','2026-08-07','Communication',NULL,0,13,'2026-08-04 06:03:12'),(18,5,'Activate OSHC','2026-08-09','Health',NULL,0,8,'2026-08-04 06:03:12'),(19,5,'Apply for USI','2026-08-11','Identity & Study',NULL,0,1,'2026-08-04 06:03:12'),(20,5,'Apply for TFN','2026-08-11','Financial',NULL,0,3,'2026-08-04 06:03:12');
/*!40000 ALTER TABLE `reminders` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

