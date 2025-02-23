CREATE DATABASE IF NOT EXISTS moderation;
USE moderation;

CREATE TABLE softbans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    ban_time DATETIME NOT NULL,
    ban_duration INT NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    guild_name VARCHAR(255) NOT NULL,
    executor_id VARCHAR(255) NOT NULL,
    executor_name VARCHAR(255) NOT NULL
);