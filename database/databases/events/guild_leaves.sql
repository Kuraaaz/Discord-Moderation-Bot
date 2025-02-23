CREATE DATABASE IF NOT EXISTS evt;
USE evt;

CREATE TABLE guild_removals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    guild_name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    removal_method VARCHAR(255) NOT NULL,
    removal_date DATETIME NOT NULL
);