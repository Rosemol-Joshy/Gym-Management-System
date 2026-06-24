-- Create Database for Apex Strength Gym Management System
CREATE DATABASE IF NOT EXISTS apex_gym_db;
USE apex_gym_db;

-- 1. Members Table
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    renewal_date DATE NOT NULL,
    last_checkin DATETIME DEFAULT NULL
);

-- 2. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    trainer VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    booked INT NOT NULL DEFAULT 0,
    day VARCHAR(10) NOT NULL,
    time_slot VARCHAR(20) NOT NULL
);

-- 3. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(20) PRIMARY KEY,
    member_id VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 4. Checkins Table
CREATE TABLE IF NOT EXISTS checkins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id VARCHAR(20) NOT NULL,
    checkin_time DATETIME NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- ==========================================================================
-- SEED DATA SETUP
-- ==========================================================================

-- Clean old data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE checkins;
TRUNCATE TABLE invoices;
TRUNCATE TABLE classes;
TRUNCATE TABLE members;
SET FOREIGN_KEY_CHECKS = 1;

-- Seed Members
INSERT INTO members (id, first_name, last_name, email, plan, status, renewal_date, last_checkin) VALUES
('MEM-9402', 'Dorian', 'Yates', 'dyates@heavy-duty.com', 'VIP Elite', 'active', '2026-08-12', '2026-06-24 07:15:00'),
('MEM-8114', 'Franco', 'Columbu', 'f.columbu@sardinia.org', 'Barbell Pro', 'active', '2026-07-19', '2026-06-24 06:30:00'),
('MEM-3320', 'Larry', 'Wheels', 'larry@wheels-lift.com', 'VIP Elite', 'active', '2026-09-02', '2026-06-23 16:45:00'),
('MEM-1209', 'Jay', 'Cutler', 'jcutler@quads.com', 'Barbell Pro', 'active', '2026-06-30', '2026-06-24 08:12:00'),
('MEM-7741', 'Serge', 'Nubret', 'snubret@paris-gym.fr', 'Standard Fit', 'suspended', '2026-06-15', '2026-06-14 09:00:00'),
('MEM-4882', 'Reg', 'Park', 'reg@park-iron.co.uk', 'Barbell Pro', 'active', '2026-10-05', '2026-06-24 08:35:00'),
('MEM-5012', 'Ronnie', 'Coleman', 'rcoleman@lightweight.com', 'VIP Elite', 'active', '2026-06-29', '2026-06-24 05:00:00'),
('MEM-2940', 'Rich', 'Gaspari', 'rich@gaspari-nutr.com', 'Standard Fit', 'expired', '2026-06-20', '2026-06-19 18:15:00'),
('MEM-6691', 'Tom', 'Platz', 'squatking@platz-quads.net', 'Barbell Pro', 'active', '2026-07-28', '2026-06-24 08:48:00'),
('MEM-1052', 'Mike', 'Mentzer', 'mentzer@heavy-duty.com', 'Standard Fit', 'expired', '2026-06-10', '2026-06-09 08:00:00'),
('MEM-1994', 'Chris', 'Bumstead', 'cbum@cbum-classic.ca', 'VIP Elite', 'active', '2026-11-22', '2026-06-23 14:22:00'),
('MEM-2091', 'Ed', 'Coan', 'edcoan@powerlifting.org', 'VIP Elite', 'active', '2026-12-01', '2026-06-24 06:05:00'),
('MEM-3301', 'Bill', 'Pearl', 'bpearl@pearl-strength.com', 'Standard Fit', 'active', '2026-07-05', '2026-06-22 10:10:00'),
('MEM-8802', 'Lenda', 'Murray', 'lmurray@pro-physique.com', 'Barbell Pro', 'active', '2026-09-14', '2026-06-23 11:30:00');

-- Seed Classes
INSERT INTO classes (name, trainer, capacity, booked, day, time_slot) VALUES
('Barbell Strength Foundations', 'Coach Stryker', 20, 18, 'Mon', '08:00 AM'),
('Powerlifting Heavy Duty', 'Coach Yates', 12, 12, 'Mon', '06:00 PM'),
('Mobility & Squat Depth', 'Coach Platz', 25, 14, 'Tue', '08:00 AM'),
('Olympic Weightlifting Tech', 'Coach Murray', 15, 9, 'Tue', '04:00 PM'),
('HIIT Conditioning', 'Coach Wheels', 30, 21, 'Wed', '08:00 AM'),
('Heavy Bench & Deadlift Day', 'Coach Stryker', 20, 20, 'Wed', '06:00 PM'),
('Barbell Strength Foundations', 'Coach Stryker', 20, 15, 'Thu', '08:00 AM'),
('High Intensity Fatigue Intro', 'Coach Mentzer', 10, 8, 'Thu', '04:00 PM'),
('Strongman Carry & Pulls', 'Coach Wheels', 16, 15, 'Fri', '06:00 PM'),
('Weekend Powerlifting Prep', 'Coach Yates', 15, 11, 'Sat', '10:00 AM'),
('Sunday Recovery & Stretch', 'Coach Platz', 25, 5, 'Sun', '12:00 PM');

-- Seed Invoices
INSERT INTO invoices (id, member_id, amount, due_date, status) VALUES
('INV-1845', 'MEM-9402', 120.00, '2026-06-25', 'Paid'),
('INV-1844', 'MEM-8114', 65.00, '2026-06-24', 'Paid'),
('INV-1843', 'MEM-1209', 65.00, '2026-06-24', 'Paid'),
('INV-1842', 'MEM-7741', 45.00, '2026-06-15', 'Pending'),
('INV-1841', 'MEM-2940', 45.00, '2026-06-20', 'Overdue'),
('INV-1840', 'MEM-1052', 45.00, '2026-06-10', 'Overdue'),
('INV-1839', 'MEM-5012', 120.00, '2026-06-08', 'Paid'),
('INV-1838', 'MEM-6691', 65.00, '2026-06-05', 'Paid'),
('INV-1837', 'MEM-1994', 120.00, '2026-05-22', 'Paid'),
('INV-1836', 'MEM-4882', 65.00, '2026-05-15', 'Overdue');

-- Seed Checkins
INSERT INTO checkins (member_id, checkin_time) VALUES
('MEM-9402', '2026-06-24 07:15:00'),
('MEM-8114', '2026-06-24 06:30:00'),
('MEM-1209', '2026-06-24 08:12:00'),
('MEM-4882', '2026-06-24 08:35:00'),
('MEM-6691', '2026-06-24 08:48:00');
