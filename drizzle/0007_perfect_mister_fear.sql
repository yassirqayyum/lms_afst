PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_course` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`trainer_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_course`("id", "title", "description", "trainer_id", "created_at", "updated_at") SELECT "id", "title", "description", "trainer_id", "created_at", "updated_at" FROM `course`;--> statement-breakpoint
DROP TABLE `course`;--> statement-breakpoint
ALTER TABLE `__new_course` RENAME TO `course`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_enrollment` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`course_id` text NOT NULL,
	`trainer_id` text NOT NULL,
	`enrolled_at` integer NOT NULL,
	`start_date` text,
	`end_date` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `course`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`trainer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_enrollment`("id", "user_id", "course_id", "trainer_id", "enrolled_at", "start_date", "end_date") SELECT "id", "user_id", "course_id", "trainer_id", "enrolled_at", "start_date", "end_date" FROM `enrollment`;--> statement-breakpoint
DROP TABLE `enrollment`;--> statement-breakpoint
ALTER TABLE `__new_enrollment` RENAME TO `enrollment`;