-- ==========================================================================
-- Gym Management System - Standalone Authentication Database Schema
-- Compatible with MySQL Server & MySQL Workbench
-- ==========================================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS gym_auth_db;
USE gym_auth_db;

-- 2. Drop existing tables if they exist to allow clean resets
DROP TABLE IF EXISTS users;

-- 3. Create Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(64) NOT NULL, -- SHA-256 hashed password (64 hex characters)
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Seed Seed Data for Testing (Default admin and default member)
-- Default admin credentials: username: admin / password: admin
-- Default member credentials: username: member / password: member
INSERT INTO users (username, email, password, full_name, role) VALUES 
('admin', 'admin@apexstrength.com', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Alex Stryker', 'Facility Manager'),
('member', 'member@apexstrength.com', 'e31ab643c44f7a0ec824b59d1194d60dac334200d845e61d2d289daa0f087ea4', 'Franco Columbu', 'Member');
