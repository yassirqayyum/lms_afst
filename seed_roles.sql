-- Disable foreign key checks temporarily to allow cleanup
PRAGMA foreign_keys = OFF;

-- Cleanup existing data
DELETE FROM enrollment;
DELETE FROM attendance;
DELETE FROM lecture;
DELETE FROM course;
DELETE FROM session;
DELETE FROM account;
DELETE FROM verification;
DELETE FROM user WHERE id IN ('trainer1', 'student1');

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;

-- Create Trainer
INSERT INTO user (id, name, email, email_verified, role, created_at, updated_at) 
VALUES ('trainer1', 'Trainer Joe', 'trainer@test.com', 1, 'trainer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create Student
INSERT INTO user (id, name, email, email_verified, role, created_at, updated_at) 
VALUES ('student1', 'Student Jane', 'student@test.com', 1, 'trainee', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create Sessions (expires in future)
INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id)
VALUES 
('session1', 1956488569000, 'token_trainer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'trainer1'),
('session2', 1956488569000, 'token_student', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'student1');

-- Create Course
INSERT INTO course (id, title, description, trainer_id, created_at, updated_at)
VALUES ('course1', 'Intro to Coding', 'Learn basic coding', 'trainer1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
