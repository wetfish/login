CREATE TABLE IF NOT EXISTS `users` (
  `user_id` varchar(64) character set utf8 NOT NULL,
  `user_name` varchar(32) character set utf8 NOT NULL,
  `user_email` varchar(254) character set utf8 NOT NULL,
  `user_password` varchar(64) character set utf8 NOT NULL,
  `user_token` varchar(64) character set utf8 NOT NULL,
  `user_verified` tinyint(1) NOT NULL,
  `user_created` datetime NOT NULL,
  `user_active` datetime NOT NULL,
  `user_data` text character set utf8 NOT NULL,
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `user_name` (`user_name`),
  UNIQUE KEY `user_email` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
