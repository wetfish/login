CREATE TABLE IF NOT EXISTS `users` (
  `user_id` varchar(64) character set utf8 NOT NULL,
  `user_name` varchar(32) character set utf8 NOT NULL,
  `user_email` varchar(254) NOT NULL,
  `user_password` varchar(64) NOT NULL,
  `user_token` varchar(64) NOT NULL,
  `user_verified` tinyint(1) NOT NULL,
  `user_created` datetime NOT NULL,
  `user_active` datetime NOT NULL,
  `user_data` text NOT NULL,
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `user_name` (`user_name`),
  UNIQUE KEY `user_email` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `apps` (
  `app_id` varchar(64) NOT NULL,
  `app_secret` varchar(64) NOT NULL,
  `app_creator` varchar(64) NOT NULL,
  `app_name` varchar(32) NOT NULL,
  `app_desc` varchar(256) NOT NULL,
  `app_url` varchar(256) NOT NULL,
  `app_callback` varchar(256) NOT NULL,
  `app_permission` text NOT NULL,
  `app_created` datetime NOT NULL,
  `app_active` datetime NOT NULL,
  UNIQUE KEY `app_id` (`app_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `app_users` (
  `user_id` varchar(64) NOT NULL,
  `app_id` varchar(64) NOT NULL,
  `app_admin` int(1) NOT NULL,
  `user_permission` text NOT NULL,
  `user_joined` datetime NOT NULL,
  KEY `user_id` (`user_id`),
  KEY `app_id` (`app_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `app_tokens` (
  `user_id` varchar(64) NOT NULL,
  `app_id` varchar(64) NOT NULL,
  `token_id` varchar(64) NOT NULL,
  `token_created` datetime NOT NULL,
  KEY `user_id` (`user_id`),
  KEY `app_id` (`app_id`),
  UNIQUE KEY `token_id` (`token_id`)  
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

