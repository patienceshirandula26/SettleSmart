
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

