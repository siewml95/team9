CREATE TABLE `Tweets` (
  `id` varchar(50) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `text` varchar(256) DEFAULT NULL,
  `lang` varchar(10) DEFAULT NULL,
  `user` varchar(50) DEFAULT NULL,
  `replyUser` varchar(50) DEFAULT NULL,
  `retweetedUser` varchar(50) DEFAULT NULL,
  `lat` double DEFAULT NULL,
  `lon` double DEFAULT NULL,
  `keyword` varchar(255) DEFAULT NULL
) 