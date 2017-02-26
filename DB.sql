-- --------------------------------------------------------
-- Сервер:                       127.0.0.1
-- Версія сервера:               5.7.16-log - MySQL Community Server (GPL)
-- ОС сервера:                   Win64
-- HeidiSQL Версія:              9.3.0.4984
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- Dumping structure for таблиця isodata.format_file
CREATE TABLE IF NOT EXISTS `format_file` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `format_name` char(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- Dumping data for table isodata.format_file: ~4 rows (приблизно)
/*!40000 ALTER TABLE `format_file` DISABLE KEYS */;
INSERT INTO `format_file` (`id`, `format_name`) VALUES
	(2, 'Відсутній'),
	(3, 'csv'),
	(4, 'doc'),
	(5, 'xls');
/*!40000 ALTER TABLE `format_file` ENABLE KEYS */;


-- Dumping structure for таблиця isodata.geo
CREATE TABLE IF NOT EXISTS `geo` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `text` varchar(100) NOT NULL,
  `lft` bigint(20) NOT NULL,
  `rgt` bigint(20) NOT NULL,
  `parentId` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `nslrl_idx` (`lft`,`rgt`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8;

-- Dumping data for table isodata.geo: ~9 rows (приблизно)
/*!40000 ALTER TABLE `geo` DISABLE KEYS */;
INSERT INTO `geo` (`id`, `text`, `lft`, `rgt`, `parentId`) VALUES
	(1, 'Земля', 1, 18, 0),
	(2, 'Африка', 3, 4, 3),
	(3, 'Європа', 2, 11, 1),
	(10, 'Північна Америка', 12, 13, 1),
	(11, 'Південна Америка', 14, 15, 1),
	(12, 'Антарктида', 16, 17, 1),
	(29, 'Україна', 5, 10, 3),
	(30, 'Приклад геообєкту', 6, 9, 29),
	(31, 'Приклад', 7, 8, 30);
/*!40000 ALTER TABLE `geo` ENABLE KEYS */;


-- Dumping structure for таблиця isodata.geo_for_items
CREATE TABLE IF NOT EXISTS `geo_for_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_items` bigint(20) NOT NULL,
  `id_geo` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_keywords_for_items_items` (`id_items`),
  KEY `id_geo` (`id_geo`),
  CONSTRAINT `FK_keywords_for_geo_geo` FOREIGN KEY (`id_geo`) REFERENCES `geo` (`id`),
  CONSTRAINT `geo_for_items_ibfk_1` FOREIGN KEY (`id_items`) REFERENCES `items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- Dumping data for table isodata.geo_for_items: ~5 rows (приблизно)
/*!40000 ALTER TABLE `geo_for_items` DISABLE KEYS */;
INSERT INTO `geo_for_items` (`id`, `id_items`, `id_geo`) VALUES
	(58, 47, 29),
	(59, 48, 29),
	(60, 49, 29),
	(61, 50, 29),
	(62, 51, 29);
/*!40000 ALTER TABLE `geo_for_items` ENABLE KEYS */;


-- Dumping structure for таблиця isodata.items
CREATE TABLE IF NOT EXISTS `items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` char(255) NOT NULL,
  `link` text NOT NULL,
  `owner` char(255) DEFAULT NULL,
  `date_start` date NOT NULL,
  `date_end` date NOT NULL,
  `description` mediumtext,
  `id_format_file` bigint(20) DEFAULT '2',
  `id_user` bigint(20) DEFAULT '1',
  `date_public` datetime DEFAULT CURRENT_TIMESTAMP,
  `operability` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FK_items_format_file` (`id_format_file`),
  KEY `FK_items_users` (`id_user`),
  CONSTRAINT `FK_items_format_file` FOREIGN KEY (`id_format_file`) REFERENCES `format_file` (`id`),
  CONSTRAINT `FK_items_users` FOREIGN KEY (`id_user`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8;

-- Dumping data for table isodata.items: ~5 rows (приблизно)
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` (`id`, `name`, `link`, `owner`, `date_start`, `date_end`, `description`, `id_format_file`, `id_user`, `date_public`, `operability`) VALUES
	(47, 'Викиди забруднюючих речовин в атмосферне повітря', 'http://data.gov.ua/passport/61a562db-30b5-4bf5-988e-037797523fd9', 'Державна служба статистики України', '2016-06-15', '2017-06-15', 'Дані, зібрані протягом останніх років по всіх регіонах України', 3, 1, '2016-12-13 15:11:52', 0),
	(48, 'Викиди забруднюючих речовин та діоксиду вуглецю в атмосферне повітря', 'http://data.gov.ua/passport/ce595398-2aa0-47da-864c-15746bc40e17', 'Державна служба статистики України', '2016-06-15', '2017-06-15', 'Дані, зібрані за останні декілька років', 3, 1, '2016-12-13 15:27:25', 1),
	(49, 'Перелік об\'єктів, які є найбільшими забруднювачами довкілля', 'http://data.gov.ua/passport/b348d687-40d6-4039-b346-171096fc6101', 'Міністерство екології та природних ресурсів України', '2016-03-28', '2017-03-28', '-', 3, 1, '2016-12-13 15:31:01', 0),
	(50, 'Викиди забруднюючих речовин в атмосферне повітря', 'http://www.menr.gov.ua/ekolohichni-pokaznyky-monitorynhu/3829-pokaznyk-a-1', NULL, '1990-01-01', '2013-12-31', 'Даний показник надає уявлення про ступінь наявного та очікуваного антропогенного тиску викидів забруднюючих речовин на навколишнє середовище, дозволяє визначити ступінь досягнення цільових значень. Оцінювання впливу на навколишнє природне середовище окремих секторів економіки, стаціонарних та пересувних джерел викидів.\n\nПоказник включає дані щодо викидів окремих забруднюючих речовин:  діоксиду сірки (SO2), оксидів азоту (NOx), аміаку (NH3), твердих часток (ТЧ10, ТЧ2,5 таабо загального вмісту зважених часток (ЗЗЧ)), оксиду вуглецю (СО),  неметанових летких органічних сполук (НМЛОС), стійких органічних сполук (СОЗ, у тому числі поліхлорбіфеніли (ПХБ), діоксини/фурани та поліциклічні ароматичні вуглеводні (ПАВ)), важких металів (кадмію, свинцю і ртуті).\n\nВ структурі РС-Т-С-В-Р показник «Викиди забруднюючих речовин у атмосферне повітря» (Т) має безпосередній зв’язок з показником «Якість атмосферного повітря в міських населених пунктах» (С).', 5, 1, '2016-12-13 16:02:05', 1),
	(51, 'Перелік територій та об`єктів природно-заповідного фонду загальнодержавного та місцевого значення в розрізі адміністративно територіальних одиниць', 'http://data.gov.ua/passport/9e011264-c16d-42ab-95f1-b06f7311103e', NULL, '2016-02-15', '2017-02-15', NULL, 3, 1, '2016-12-13 16:04:04', 1);
/*!40000 ALTER TABLE `items` ENABLE KEYS */;


-- Dumping structure for таблиця isodata.keyword
CREATE TABLE IF NOT EXISTS `keyword` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `text` varchar(100) NOT NULL,
  `lft` bigint(20) NOT NULL,
  `rgt` bigint(20) NOT NULL,
  `parentId` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `nslrl_idx` (`lft`,`rgt`),
  KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- Dumping data for table isodata.keyword: ~17 rows (приблизно)
/*!40000 ALTER TABLE `keyword` DISABLE KEYS */;
INSERT INTO `keyword` (`id`, `text`, `lft`, `rgt`, `parentId`) VALUES
	(1, 'Слово', 1, 34, 0),
	(24, 'моніторинг довкілля', 10, 11, 1),
	(29, 'викиди', 12, 17, 1),
	(30, 'забруднюючі речовини', 13, 16, 29),
	(31, 'атмосферне повітря', 14, 15, 30),
	(32, 'викиди забруднюючих речовин', 18, 25, 1),
	(33, 'стаціонарними джерелами забруднення', 19, 24, 32),
	(34, 'пересувними джерелами забруднення', 20, 23, 33),
	(35, 'викиди діоксиду', 21, 22, 34),
	(36, 'забруднювачі довкілля', 26, 29, 1),
	(37, 'найбільші забруднювачі', 27, 28, 36),
	(38, 'забруднюючі речовини', 2, 9, 1),
	(39, 'діоксид сірки', 3, 8, 38),
	(40, 'оксид азоту', 4, 7, 39),
	(41, 'важкі метали', 5, 6, 40),
	(42, 'природно-заповідний фонд', 30, 33, 1),
	(43, 'перелік територій', 31, 32, 42);
/*!40000 ALTER TABLE `keyword` ENABLE KEYS */;


-- Dumping structure for таблиця isodata.keywords_for_items
CREATE TABLE IF NOT EXISTS `keywords_for_items` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_items` bigint(20) NOT NULL,
  `id_keyword` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_keywords_for_items_keywords` (`id_keyword`),
  KEY `FK_keywords_for_items_items` (`id_items`),
  CONSTRAINT `FK_keywords_for_items_items` FOREIGN KEY (`id_items`) REFERENCES `items` (`id`),
  CONSTRAINT `FK_keywords_for_items_keyword` FOREIGN KEY (`id_keyword`) REFERENCES `keyword` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8;

-- Dumping data for table isodata.keywords_for_items: ~5 rows (приблизно)
/*!40000 ALTER TABLE `keywords_for_items` DISABLE KEYS */;
INSERT INTO `keywords_for_items` (`id`, `id_items`, `id_keyword`) VALUES
	(28, 47, 31),
	(29, 48, 35),
	(30, 49, 37),
	(31, 50, 41),
	(32, 51, 43);
/*!40000 ALTER TABLE `keywords_for_items` ENABLE KEYS */;


-- Dumping structure for таблиця isodata.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `login` char(50) NOT NULL DEFAULT '0',
  `email` char(255) NOT NULL DEFAULT '0',
  `pass` char(255) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- Dumping data for table isodata.users: ~1 rows (приблизно)
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `login`, `email`, `pass`) VALUES
	(1, 'admin', '-', '1234');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
