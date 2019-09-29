-- MySQL dump 10.13  Distrib 5.7.26, for Win32 (AMD64)
--
-- Host: 192.168.202.73    Database: restserver
-- ------------------------------------------------------
-- Server version	5.7.25
USE restserver;

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

--
-- Table structure for table `common_item_t`
--

DROP TABLE IF EXISTS `common_item_t`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `common_item_t` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_key` varchar(100) NOT NULL,
  `item_value` varchar(500) NOT NULL,
  `item_name` varchar(80) NOT NULL,
  `type_id` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `common_item_t`
--

LOCK TABLES `common_item_t` WRITE;
/*!40000 ALTER TABLE `common_item_t` DISABLE KEYS */;
INSERT INTO `common_item_t` VALUES (1,'LIMITS','{\"cpuNumber\":16,\"gpuNumber\":3,\"memoryMB\":128000,\"shmMB\":64000,\"maxAvailableGPUJob\":2,\"maxAvailableCPUJob\":1}','任务限制',1,'任务限制','2019-01-17 14:21:26','2019-01-17 14:21:26'),(2,'LIMIT_WHITE_LIST','admin,','任务限制白名单',1,',隔开','2019-01-17 15:38:52','2019-04-28 10:45:31');
/*!40000 ALTER TABLE `common_item_t` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `common_type_t`
--

DROP TABLE IF EXISTS `common_type_t`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `common_type_t` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_key` varchar(100) NOT NULL,
  `type_name` varchar(80) NOT NULL,
  `description` varchar(255) DEFAULT '',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type_key` (`type_key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `common_type_t`
--

LOCK TABLES `common_type_t` WRITE;
/*!40000 ALTER TABLE `common_type_t` DISABLE KEYS */;
INSERT INTO `common_type_t` VALUES (1,'JOB_CONFIG_TYPE','JOB','JOB','2019-01-17 14:18:42','2019-01-17 14:18:42');
/*!40000 ALTER TABLE `common_type_t` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `data_set_t`
--

DROP TABLE IF EXISTS `data_set_t`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `data_set_t` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `place` varchar(255) NOT NULL DEFAULT '',
  `description` varchar(255) NOT NULL DEFAULT '',
  `provider` varchar(255) NOT NULL DEFAULT '',
  `remark` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_set_t`
--

LOCK TABLES `data_set_t` WRITE;
/*!40000 ALTER TABLE `data_set_t` DISABLE KEYS */;
/*!40000 ALTER TABLE `data_set_t` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `image_set_job_platform_r_t`
--

DROP TABLE IF EXISTS `image_set_job_platform_r_t`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `image_set_job_platform_r_t` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_set_id` int(11) NOT NULL,
  `job_platform_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `image_set_job_platform_r_t_image_set_id_job_platform_id` (`image_set_id`,`job_platform_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `image_set_job_platform_r_t`
--

LOCK TABLES `image_set_job_platform_r_t` WRITE;
/*!40000 ALTER TABLE `image_set_job_platform_r_t` DISABLE KEYS */;
INSERT INTO `image_set_job_platform_r_t` VALUES (1,1000000,1,'2019-01-16 20:18:37','2019-01-16 20:18:37'),(2,1000000,3,'2019-01-16 20:18:37','2019-01-16 20:18:37'),(3,1000000,2,'2019-05-17 11:36:30','2019-05-17 11:36:33');
/*!40000 ALTER TABLE `image_set_job_platform_r_t` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `imageset`
--

DROP TABLE IF EXISTS `imageset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `imageset` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  `place` varchar(255) NOT NULL DEFAULT '',
  `description` text,
  `provider` varchar(255) NOT NULL DEFAULT '',
  `createtime` datetime NOT NULL,
  `remark` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1000004 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `imageset`
--

LOCK TABLES `imageset` WRITE;
/*!40000 ALTER TABLE `imageset` DISABLE KEYS */;
INSERT INTO `imageset` VALUES (1000000,'deepo:v2.0','$dockerRegistry/user-images/deepo:v2.0','# deepo:v2.0\n\n- DeepoDocker \n  theano, tensorflow, sonnet, pytorch, keras, lasagne, mxnet, cntk, chainer, caffe, torch\n- \n          Ubuntu16.04  \n\n    CUDA          8.0.61  \n\n    CUDNN         V6   \n\n    Python        3.6.6    \n\n    PyTorch       0.4.0    \n\n    Tensorflow    1.8.0   \n\n    Keras         2.2.2    \n\n    Theano        1.0.1    \n\n    Sonnet        1.23    \n\n    MxNett        1.2.0    \n\n    Caffe         1.0.0    \n\n    CNTK          2.5.1\r\n   \r\n    jupyter\r\n\r\n- [github](https://github.com/ufoym/deepo)','admin','2018-12-03 12:40:27','good');
/*!40000 ALTER TABLE `imageset` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_platform_t`
--

DROP TABLE IF EXISTS `job_platform_t`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_platform_t` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `platform_key` varchar(100) NOT NULL,
  `name` varchar(80) NOT NULL,
  `standard` text,
  `description` varchar(255) DEFAULT '',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `action` enum('debug','no_debug','ssh','no_ssh') NOT NULL DEFAULT 'no_debug',
  PRIMARY KEY (`id`),
  UNIQUE KEY `platform_key` (`platform_key`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_platform_t`
--

LOCK TABLES `job_platform_t` WRITE;
/*!40000 ALTER TABLE `job_platform_t` DISABLE KEYS */;
INSERT INTO `job_platform_t` VALUES (1,'debug_cpu','DEBUG_CPU','{\"taskNumber\":1,\"cpuNumber\":1,\"memoryMB\":2048,\"shmMB\":1024,\"gpuNumber\":0,\"command\":\"sleep 7d\"}','debug_cpu','2019-05-17 11:31:16','2019-05-17 11:31:19','ssh'),(2,'debug','DEBUG','{\"taskNumber\":1,\"cpuNumber\":2,\"memoryMB\":16384,\"shmMB\":8192,\"gpuNumber\":1,\"command\":\"pip install jupyterlab;service ssh stop;jupyter lab --no-browser --ip=0.0.0.0 --allow-root --notebook-dir=\\\"/userhome\\\" --port=80 --LabApp.base_url=\\\"/jpylab\\\" --LabApp.allow_origin=\\\"self https://cloudbrain.pcl.ac.cn\\\"\"}','debug','2019-05-17 11:06:30','2019-05-17 11:06:33','debug'),(3,'run','RUN','{\"taskNumber\":1,\"cpuNumber\":4,\"memoryMB\":16384,\"gpuNumber\":1}','run','2019-09-29 06:28:27','2019-09-29 06:28:31','no_debug');
/*!40000 ALTER TABLE `job_platform_t` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_record`
--

DROP TABLE IF EXISTS `job_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `job_record` (
  `job_id` varchar(64) NOT NULL,
  `job_name` varchar(64) NOT NULL,
  `job_type` varchar(24) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `org_id` varchar(64) DEFAULT NULL,
  `resource_usage` json DEFAULT NULL,
  `job_state` varchar(24) DEFAULT NULL,
  `job_detail` json DEFAULT NULL,
  `job_config` json DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`job_id`),
  KEY `job_record_user_id` (`user_id`),
  KEY `job_record_job_name` (`job_name`),
  KEY `job_record_job_state` (`job_state`),
  KEY `completed_time_index` (`completed_at`),
  KEY `job_record_completed_at` (`completed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_record`
--

LOCK TABLES `job_record` WRITE;
/*!40000 ALTER TABLE `job_record` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_t`
--

DROP TABLE IF EXISTS `organization_t`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_t` (
  `id` tinytext,
  `name` tinytext,
  `ids` tinytext,
  `pid` tinytext,
  `typ` tinytext,
  `description` tinytext,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `names` tinytext
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_t`
--

LOCK TABLES `organization_t` WRITE;
/*!40000 ALTER TABLE `organization_t` DISABLE KEYS */;
INSERT INTO `organization_t` VALUES ('0nhpt03n64m','test1556097151380','0nhpt03n64m',NULL,'default','test','2019-04-24 17:12:34','2019-04-24 17:12:34','test1556097151380'),('1wlsc2w5iew','自主健康','tptc679ma5h,1wlsc2w5iew','tptc679ma5h','default','','2019-01-22 17:44:28','2019-01-22 17:44:28',','),('2qxhziamnup','网络通讯研究中心','2qxhziamnup','','default','','2019-01-22 17:06:02','2019-01-22 17:06:02',''),('4v967izytvp','trustie社区','4v967izytvp',NULL,'trustie','trustie','2019-03-03 15:41:19','2019-03-03 15:41:19','trustie'),('5p04ne1kicd','test_1556097151355','tptc679ma5h,5p04ne1kicd','tptc679ma5h','default','自动化测试','2019-04-24 17:12:34','2019-04-24 17:12:34',',test_1556097151355'),('6tvz58bvgfs','其它','k9iujgpaajn,6tvz58bvgfs','k9iujgpaajn','default','','2019-01-22 17:46:55','2019-01-22 17:46:55',','),('7hjyatedvaj','未来区域网络','2qxhziamnup,7hjyatedvaj','2qxhziamnup','default','','2019-01-22 17:46:10','2019-01-22 17:46:10',','),('apgllogz64v','','pbf9hb3hiff,apgllogz64v','pbf9hb3hiff','default','','2019-01-22 17:45:13','2019-01-22 17:45:13',','),('b1ra7qw4vpb','test_1556417706652','tptc679ma5h,b1ra7qw4vpb','tptc679ma5h','default','自动化测试','2019-04-28 10:15:09','2019-04-28 10:15:09',',test_1556417706652'),('btzdq6dnetb','','pbf9hb3hiff,btzdq6dnetb','pbf9hb3hiff','default','','2019-01-22 17:45:35','2019-01-22 17:45:35',','),('ehjf03p6eil','test1556419528534','ehjf03p6eil',NULL,'default','test','2019-04-28 10:45:31','2019-04-28 10:45:31','test1556419528534'),('g02nb8eho2a','test_1556417151933','tptc679ma5h,g02nb8eho2a','tptc679ma5h','default','自动化测试','2019-04-28 10:05:54','2019-04-28 10:05:54',',test_1556417151933'),('hytq8d1cpr8','test_1556418081934','tptc679ma5h,hytq8d1cpr8','tptc679ma5h','default','自动化测试','2019-04-28 10:21:24','2019-04-28 10:21:24',',test_1556418081934'),('j3c4piwqy6p','','tptc679ma5h,j3c4piwqy6p','tptc679ma5h','default','','2019-01-22 17:44:18','2019-01-22 17:44:18',','),('k9iujgpaajn','','k9iujgpaajn','','default','','2019-01-22 17:05:10','2019-01-22 17:05:10',''),('kxhxc28t7ms','test1556417706708','kxhxc28t7ms',NULL,'default','test','2019-04-28 10:15:09','2019-04-28 10:15:09','test1556417706708'),('l8o9lymmp4c','test1556097146209','l8o9lymmp4c',NULL,'default','test','2019-04-24 17:12:29','2019-04-24 17:12:29','test1556097146209'),('lt0jdox7tq5','','2qxhziamnup,lt0jdox7tq5','2qxhziamnup','default','','2019-01-22 17:46:18','2019-01-22 17:46:18',','),('lwc4pn2kto8','','2qxhziamnup,lwc4pn2kto8','2qxhziamnup','default','','2019-01-22 17:46:02','2019-01-22 17:46:02',','),('m4xnivpjx1i','','tptc679ma5h,m4xnivpjx1i','tptc679ma5h','default','','2019-01-22 17:44:08','2019-01-22 17:44:08',','),('pbf9hb3hiff','','pbf9hb3hiff','','default','','2019-01-22 17:05:47','2019-01-22 17:05:47',''),('pr5rhes6y9i','','pbf9hb3hiff,pr5rhes6y9i','pbf9hb3hiff','default','','2019-01-22 17:45:26','2019-01-22 17:45:26',','),('qzm0452s4po','test1556417152051','qzm0452s4po',NULL,'default','test','2019-04-28 10:05:54','2019-04-28 10:05:54','test1556417152051'),('s82fycm2rxk','test_1556419528499','tptc679ma5h,s82fycm2rxk','tptc679ma5h','default','自动化测试','2019-04-28 10:45:31','2019-04-28 10:45:31',',test_1556419528499'),('ti5j8turbkw','test1556418082007','ti5j8turbkw',NULL,'default','test','2019-04-28 10:21:24','2019-04-28 10:21:24','test1556418082007'),('tptc679ma5h','人工智能研究中心','tptc679ma5h','','default','','2019-01-22 17:04:05','2019-01-22 17:04:05',''),('uzwqh8605b1','','tptc679ma5h,uzwqh8605b1','tptc679ma5h','default','','2019-01-22 17:44:37','2019-01-22 17:44:37',','),('vc8a4p4rgz0','开源平台','tptc679ma5h,vc8a4p4rgz0','tptc679ma5h','default','','2019-01-22 17:43:50','2019-01-22 17:43:50',','),('y3ggnjyqeqa','','4v967izytvp,y3ggnjyqeqa','4v967izytvp','trustie','','2019-03-03 15:44:07','2019-03-03 15:44:07','trustie,'),('zxg0i3nhsu2','test_1556097146144','tptc679ma5h,zxg0i3nhsu2','tptc679ma5h','default','自动化测试','2019-04-24 17:12:29','2019-04-24 17:12:29',',test_1556097146144');
/*!40000 ALTER TABLE `organization_t` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `third_user_t`
--

DROP TABLE IF EXISTS `third_user_t`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `third_user_t` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `third_id` varchar(255) NOT NULL,
  `platform` varchar(255) NOT NULL,
  `origin_data` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `third_user_t_third_id_platform` (`third_id`,`platform`),
  KEY `third_user_t_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='第三方用户';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `third_user_t`
--

LOCK TABLES `third_user_t` WRITE;
/*!40000 ALTER TABLE `third_user_t` DISABLE KEYS */;
/*!40000 ALTER TABLE `third_user_t` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `type_blackwhite_t`
--

DROP TABLE IF EXISTS `type_blackwhite_t`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `type_blackwhite_t` (
  `type` varchar(255) NOT NULL,
  `local_limit` enum('black','white') NOT NULL DEFAULT 'black',
  `local_users` text NOT NULL,
  `global_limit` enum('black','white') NOT NULL DEFAULT 'black',
  `description` varchar(255) NOT NULL DEFAULT '',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `type_blackwhite_t`
--

LOCK TABLES `type_blackwhite_t` WRITE;
/*!40000 ALTER TABLE `type_blackwhite_t` DISABLE KEYS */;
INSERT INTO `type_blackwhite_t` VALUES ('debug','black','','white','','2019-07-19 06:29:50','2019-07-19 06:29:53'),('debug_cpu','black','','white','','2019-07-19 06:30:39','2019-07-19 06:30:41'),('run','black',' ','white','','2019-09-29 14:43:13','2019-09-29 14:43:18');
/*!40000 ALTER TABLE `type_blackwhite_t` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET latin1 NOT NULL DEFAULT '',
  `passwordKey` varchar(255) CHARACTER SET latin1 NOT NULL DEFAULT '',
  `admin` tinyint(1) DEFAULT '0',
  `virtualCluster` text CHARACTER SET latin1 NOT NULL,
  `modifyTime` datetime NOT NULL,
  `email` varchar(50) DEFAULT NULL,
  `full_name` varchar(50) DEFAULT NULL,
  `uid` varchar(32) DEFAULT NULL,
  `org_id` varchar(32) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `teacher` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `users_full_name` (`full_name`),
  KEY `users_org_id` (`org_id`),
  KEY `users_teacher` (`teacher`)
) ENGINE=InnoDB AUTO_INCREMENT=1003 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1000,'admin','59cb8ddd364e95f3f95b187b3c759d6e24b1c2a2e0a2aa82acc415ecfde60c60e1f476ceb560b1d1d5b128cd1d53f5725bc4f8ad2621fd2f59c604454b14f5d7',1,'default','2018-12-29 03:31:04','admin@pcl.ac.cn','admin','_62z89is4q9v5ln4vkd2un2ibdrc0vj5','default','2018-12-01 00:00:00','2019-09-27 20:01:01','admin','+86-13500000000',11);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `v2_users`
--

DROP TABLE IF EXISTS `v2_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `v2_users` (
  `user_id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL DEFAULT '',
  `admin` tinyint(1) DEFAULT '0',
  `in_white_list` tinyint(1) DEFAULT '0',
  `status` int(11) DEFAULT '10',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  KEY `v2_users_user_id` (`user_id`),
  KEY `v2_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `v2_users`
--

LOCK TABLES `v2_users` WRITE;
/*!40000 ALTER TABLE `v2_users` DISABLE KEYS */;
INSERT INTO `v2_users` VALUES ('21232F297A57A5A743894A0E4A801FC3','admin',0,0,10,'2019-09-29 10:18:28','2019-09-29 10:46:23');
/*!40000 ALTER TABLE `v2_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2019-09-29 17:12:26
