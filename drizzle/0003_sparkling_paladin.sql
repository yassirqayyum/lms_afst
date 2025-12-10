CREATE TABLE `attendance` (
	`id` text PRIMARY KEY NOT NULL,
	`lecture_id` text NOT NULL,
	`trainee_id` text NOT NULL,
	`status` text NOT NULL,
	`marked_at` integer NOT NULL,
	FOREIGN KEY (`lecture_id`) REFERENCES `lecture`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trainee_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `course` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`trainer_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`trainer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `enrollment` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`trainee_id` text NOT NULL,
	`enrolled_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trainee_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lecture` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`scheduled_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP TABLE `task`;--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'trainee' NOT NULL;