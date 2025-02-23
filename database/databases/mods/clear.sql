CREATE DATABASE IF NOT EXISTS moderation;
USE moderation;

CREATE TABLE clear_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    guild_name VARCHAR(255) NOT NULL,
    clear_date DATETIME NOT NULL,
    message_count INT NOT NULL
);