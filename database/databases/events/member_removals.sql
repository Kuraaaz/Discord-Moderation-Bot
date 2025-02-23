CREATE DATABASE IF NOT EXISTS evt;
USE evt;

CREATE TABLE member_removals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    guild_id VARCHAR(50) NOT NULL,
    leave_date DATETIME NOT NULL,
    removal_method ENUM('left', 'kicked', 'banned', 'softbanned') NOT NULL
);
