CREATE DATABASE IF NOT EXISTS moderation;
USE moderation;

CREATE TABLE IF NOT EXISTS warn (
    user_id VARCHAR(20) NOT NULL,
    username VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    warned_by_id VARCHAR(20) NOT NULL,
    warned_by_username VARCHAR(100) NOT NULL,
    warned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    warn_id INT NOT NULL DEFAULT 0
);