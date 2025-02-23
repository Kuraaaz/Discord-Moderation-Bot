CREATE DATABASE IF NOT EXISTS moderation;
USE moderation;

CREATE TABLE say_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_content TEXT NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    guild_name VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    executor_id VARCHAR(255) NOT NULL,
    executor_name VARCHAR(255) NOT NULL,
    say_date DATETIME NOT NULL
);