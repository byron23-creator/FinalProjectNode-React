-- Fix Admin User Script
-- This script fixes the admin user with a properly hashed password
-- Password: admin123
-- Run this in MySQL Workbench or via command line

USE event_management;

-- Delete the existing admin user with invalid hash
DELETE FROM users WHERE email = 'admin@events.com';

-- Insert admin user with properly hashed password
-- Password: admin123
-- Hash generated using bcrypt with salt rounds = 10
INSERT INTO users (email, password, first_name, last_name, role_id) VALUES 
('admin@events.com', '$2a$10$DmWqaI2orA6c1PX5bH8P6eYrn6Aguvps.ZiQelPVFFFJMk/v2IxCy', 'Admin', 'User', 1);

-- Verify the admin user was created
SELECT id, email, first_name, last_name, role_id, created_at 
FROM users 
WHERE email = 'admin@events.com';
