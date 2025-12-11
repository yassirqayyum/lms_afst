-- Disable foreign key checks temporarily to allow cleanup
PRAGMA foreign_keys = OFF;

-- Cleanup existing data
DELETE FROM lecture_file;
DELETE FROM enrollment;
DELETE FROM attendance;
DELETE FROM lecture;
DELETE FROM course;
DELETE FROM session;
DELETE FROM account;
DELETE FROM verification;
DELETE FROM user;

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;

-- Create Admin
INSERT INTO user (id, name, email, email_verified, role, approved, created_at, updated_at) 
VALUES ('admin1', 'Admin User', 'admin@lms.com', 1, 'admin', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create Admin Account (Password: password)
INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES ('acc_admin', 'admin1', 'credential', 'admin1', 'Wy6Wi8rGpoMgiDdU/skdBzJLQREV106EbGy6hyO/dNoh6ZL4wjTRyb0AXdwqGTRI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create Trainer
INSERT INTO user (id, name, email, email_verified, role, approved, created_at, updated_at) 
VALUES ('trainer1', 'Trainer Joe', 'trainer@test.com', 1, 'trainer', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create Trainer Account (Password: password)
INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES ('acc_trainer', 'trainer1', 'credential', 'trainer1', 'Wy6Wi8rGpoMgiDdU/skdBzJLQREV106EbGy6hyO/dNoh6ZL4wjTRyb0AXdwqGTRI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create Student
INSERT INTO user (id, name, email, email_verified, role, approved, created_at, updated_at) 
VALUES ('student1', 'Student Jane', 'student@test.com', 1, 'trainee', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create Student Account (Password: password)
INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
VALUES ('acc_student', 'student1', 'credential', 'student1', 'Wy6Wi8rGpoMgiDdU/skdBzJLQREV106EbGy6hyO/dNoh6ZL4wjTRyb0AXdwqGTRI', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create Sessions (expires in future)
INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id)
VALUES 
('session_admin', 1956488569000, 'token_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin1'),
('session1', 1956488569000, 'token_trainer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'trainer1'),
('session2', 1956488569000, 'token_student', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'student1');

-- Create Course
INSERT INTO course (id, title, description, trainer_id, created_at, updated_at)
VALUES ('course1', 'Full Stack Web Dev', 'Advance Full Stack Course', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create Enrollment for Trainer (Assigning trainer to course)
-- Note: 'trainer_id' in enrollment table means "Trainer assigned to this enrollment".
-- But the Logic we implemented for "My Courses" checks: SELECT DISTINCT course.* FROM course JOIN enrollment ON ... WHERE enrollment.trainer_id = user.id
-- So we need an enrollment record where trainer_id is 'trainer1'.
-- Let's enroll 'student1' into 'course1' with 'trainer1' as the instructor.
INSERT INTO enrollment (id, user_id, course_id, trainer_id, enrolled_at, start_date, end_date)
VALUES ('enroll1', 'student1', 'course1', 'trainer1', CURRENT_TIMESTAMP, NULL, NULL);

