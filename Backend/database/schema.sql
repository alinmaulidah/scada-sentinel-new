CREATE DATABASE IF NOT EXISTS `scada-sentinel`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `scada-sentinel`;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin',
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  status VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_username_unique (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sensor_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  timestamp DATETIME NOT NULL,
  segment_id DECIMAL(20, 4) NOT NULL,
  pressure DECIMAL(20, 6) NOT NULL,
  flow_rate DECIMAL(20, 6) NOT NULL,
  temperature DECIMAL(20, 6) NOT NULL,
  valve_status DECIMAL(20, 6) NOT NULL,
  pump_state DECIMAL(20, 6) NOT NULL,
  pump_speed DECIMAL(20, 6) NOT NULL,
  compressor_state DECIMAL(20, 6) NOT NULL,
  energy_consumption DECIMAL(20, 6) NOT NULL,
  alarm_triggered TINYINT NOT NULL,
  event_type VARCHAR(100) NOT NULL DEFAULT 'normal',
  target TINYINT NOT NULL,
  row_index INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY sensor_logs_row_index (row_index),
  KEY sensor_logs_timestamp (timestamp),
  KEY sensor_logs_segment_id (segment_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS algorithm_results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  algorithm VARCHAR(50) NOT NULL,
  normalization VARCHAR(50) NOT NULL,
  cluster VARCHAR(50) NOT NULL,
  eps DECIMAL(20, 6) DEFAULT NULL,
  min_samples INT DEFAULT NULL,
  anomaly INT UNSIGNED NOT NULL DEFAULT 0,
  normal INT UNSIGNED NOT NULL DEFAULT 0,
  silhouette DECIMAL(12, 6) NOT NULL DEFAULT 0,
  davies_bouldin DECIMAL(12, 6) NOT NULL DEFAULT 0,
  accuracy DECIMAL(12, 6) NOT NULL DEFAULT 0,
  precision_score DECIMAL(12, 6) NOT NULL DEFAULT 0,
  recall_score DECIMAL(12, 6) NOT NULL DEFAULT 0,
  f1_score DECIMAL(12, 6) NOT NULL DEFAULT 0,
  status VARCHAR(100) NOT NULL DEFAULT 'Done',
  anomaly_details JSON NOT NULL,
  normal_details JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY algorithm_results_created_at (created_at)
) ENGINE=InnoDB;
