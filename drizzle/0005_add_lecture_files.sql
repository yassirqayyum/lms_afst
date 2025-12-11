-- Migration: Add lecture_file table for file attachments
CREATE TABLE `lecture_file` (
	`id` text PRIMARY KEY NOT NULL,
	`lecture_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_url` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`uploaded_at` integer NOT NULL,
	FOREIGN KEY (`lecture_id`) REFERENCES `lecture`(`id`) ON UPDATE no action ON DELETE cascade
);
