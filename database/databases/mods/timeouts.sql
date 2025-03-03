
CREATE DATABASE IF NOT EXISTS moderation;
USE moderation;

CREATE TABLE timeouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    timeout_time DATETIME NOT NULL,
    timeout_duration INT NOT NULL
);