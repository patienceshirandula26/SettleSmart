
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

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
INSERT INTO `tasks` VALUES (1,1,'Apply for USI','Create your Unique Student Identifier','10 minutes','https://www.usi.gov.au/','High',7,1),(2,1,'Collect Student ID','Collect your university student ID card','15 minutes',NULL,'Medium',14,2),(3,2,'Apply for TFN','Apply for a Tax File Number','15 minutes','https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn','High',7,1),(4,2,'Open Bank Account','Open an Australian bank account','30 minutes',NULL,'High',10,2),(5,2,'Receive Bank Card','Collect your debit card','7 days',NULL,'Medium',21,3),(6,3,'Purchase Go Card','Buy a Go Card for public transport','10 minutes','https://translink.com.au/tickets-and-fares/go-card','Medium',10,1),(7,3,'Verify International Driver Licence','Check if your overseas licence can be used','20 minutes','https://www.qld.gov.au/transport/licensing/driver-licences/overseas-licences','Low',60,2),(8,4,'Activate OSHC','Check and activate your Overseas Student Health Cover','15 minutes','https://www.studyaustralia.gov.au/en/plan-your-studies/overseas-student-health-cover-oshc','High',5,1),(9,5,'Upload Rental Agreement','Store a copy of your rental agreement','10 minutes',NULL,'Medium',21,1),(10,6,'Apply for Blue Card','If required for child-related employment','20 minutes','https://www.qld.gov.au/law/laws-regulated-industries-and-accountability/queensland-laws-and-regulations/regulated-industries-and-licensing/blue-card','Low',45,1),(11,6,'Apply for Yellow Card','NDIS Worker Screening if required','20 minutes','https://www.workerscreening.qld.gov.au/','Low',45,2),(12,6,'Apply for Red Card','Construction industry induction if required','20 minutes',NULL,'Low',45,3),(13,7,'Purchase Australian SIM Card','Buy and activate an Australian SIM card','20 minutes',NULL,'High',3,1),(14,8,'Create Resume','Prepare an Australian-style resume','1 hour',NULL,'Medium',30,1),(15,8,'Create LinkedIn Profile','Create or update your LinkedIn profile','45 minutes',NULL,'Low',40,2),(16,1,'Organise Passport & Visa Copies','Keep digital and physical copies of both','15 minutes',NULL,'High',3,3),(17,4,'Set Up Emergency Contacts','Save local emergency and university contacts','10 minutes',NULL,'Medium',14,2),(18,5,'Set Up Home Internet','Arrange internet at your accommodation','30 minutes',NULL,'Low',30,2),(19,2,'Set Up Superannuation','Open a super account before you start working','30 minutes',NULL,'Medium',45,4);
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

