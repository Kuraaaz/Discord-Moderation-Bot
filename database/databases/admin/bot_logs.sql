-- Active: 1740992015612@@127.0.0.1@3306

CREATE DATABASE IF NOT EXISTS bot_logs;

USE bot_logs;

CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    guild_id VARCHAR(255),
    guild_name VARCHAR(255),
    channel_id VARCHAR(255),
    channel_name VARCHAR(255),
    user_id VARCHAR(255),
    username VARCHAR(255),
    timestamp DATETIME NOT NULL
);