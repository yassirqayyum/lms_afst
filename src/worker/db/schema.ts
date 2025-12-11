import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userRoleEnum = ["admin", "trainer", "trainee"] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const user = sqliteTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
    image: text("image"),
    role: text("role", { enum: userRoleEnum }).notNull().default("trainee"),
    approved: integer("approved", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
});

export const account = sqliteTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
        mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
        mode: "timestamp",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }),
    updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const course = sqliteTable("course", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    trainerId: text("trainer_id"), // Made optional
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const enrollment = sqliteTable("enrollment", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
        .notNull()
        .references(() => course.id, { onDelete: "cascade" }),
    trainerId: text("trainer_id") // Added required trainer assignment
        .notNull()
        .references(() => user.id),
    enrolledAt: integer("enrolled_at", { mode: "timestamp" }).notNull(),
    startDate: text("start_date"),
    endDate: text("end_date"),
});

export const lecture = sqliteTable("lecture", {
    id: text("id").primaryKey(),
    courseId: text("course_id")
        .notNull()
        .references(() => course.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const attendance = sqliteTable("attendance", {
    id: text("id").primaryKey(),
    lectureId: text("lecture_id")
        .notNull()
        .references(() => lecture.id, { onDelete: "cascade" }),
    traineeId: text("trainee_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull(), // 'present', 'absent', 'late'
    markedAt: integer("marked_at", { mode: "timestamp" }).notNull(),
});

export const lectureFile = sqliteTable("lecture_file", {
    id: text("id").primaryKey(),
    lectureId: text("lecture_id")
        .notNull()
        .references(() => lecture.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    uploadedAt: integer("uploaded_at", { mode: "timestamp" }).notNull(),
});
