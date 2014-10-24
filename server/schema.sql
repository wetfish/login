CREATE TABLE IF NOT EXISTS `users` (
  `user_id` varchar(64) character set utf8 NOT NULL,
  `user_name` varchar(32) character set utf8 NOT NULL,
  `user_email` varchar(256) character set utf8 NOT NULL,
  `user_password` varchar(64) character set utf8 NOT NULL,
  `user_token` varchar(64) character set utf8 NOT NULL,
  `user_verified` tinyint(1) NOT NULL,
  `user_created` datetime NOT NULL,
  `user_active` datetime NOT NULL,
  `user_data` text character set utf8 NOT NULL,
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
