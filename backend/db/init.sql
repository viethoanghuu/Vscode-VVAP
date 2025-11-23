CREATE DATABASE IF NOT EXISTS reviews_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reviews_db;

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
  PRIMARY KEY (product_id, source, review_id),
  INDEX idx_product (product_id)
);
