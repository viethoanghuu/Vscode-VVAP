CREATE DATABASE IF NOT EXISTS reviews_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reviews_db;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(512) NULL,
  source_url VARCHAR(512) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS reviews (
  product_id VARCHAR(120) NOT NULL,
  source VARCHAR(64) NOT NULL,
  review_id VARCHAR(160) NOT NULL,
  author VARCHAR(160),
  rating TINYINT NOT NULL,
  title VARCHAR(255),
  body TEXT,
  created_at DATETIME,
  fetched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'approved', 'flagged', 'rejected') NOT NULL DEFAULT 'approved',
  flag_reason VARCHAR(255) NULL,
  last_moderated_at DATETIME NULL,
  helpful_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, source, review_id),
  INDEX idx_product (product_id),
  INDEX idx_status (status)
);

-- Defensive ALTERs for existing databases
ALTER TABLE reviews
  ADD COLUMN status ENUM('pending', 'approved', 'flagged', 'rejected') NOT NULL DEFAULT 'approved',
  ADD COLUMN flag_reason VARCHAR(255) NULL,
  ADD COLUMN last_moderated_at DATETIME NULL,
  ADD COLUMN helpful_count INT NOT NULL DEFAULT 0,
  ADD COLUMN like_count INT NOT NULL DEFAULT 0,
  ADD COLUMN dislike_count INT NOT NULL DEFAULT 0;
