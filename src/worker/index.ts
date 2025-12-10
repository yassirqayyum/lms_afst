import { Hono } from "hono";
import { getAuth } from "./lib/auth";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import * as schema from "./db/schema";
import { getAuthUser } from "./lib/get-auth-user";

const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

const updateUserSchema = z.object({
  role: z.enum(["admin", "trainer", "trainee"]).optional(),
  approved: z.boolean().optional(),
});

const createLectureSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledAt: z.string().datetime(),
});

const markAttendanceSchema = z.object({
  lectureId: z.string().min(1, "Lecture ID is required"),
  traineeId: z.string().min(1, "Trainee ID is required"),
  status: z.enum(["present", "absent", "late"]),
});


const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = getAuth(c.env);
  return auth.handler(c.req.raw);
});

app.get("/api/me", async (c) => {
  const auth = getAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB);
  const [dbUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id));

  return c.json({ user: dbUser || session.user });
});

app.get("/api/users", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB);
  // Get all users
  const users = await db.select().from(schema.user);

  return c.json({ users });
});

app.post("/api/admin/users/:id/approve", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, user.id));

  if (!dbUser || dbUser.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  const userId = c.req.param("id");

  await db
    .update(schema.user)
    .set({ approved: true })
    .where(eq(schema.user.id, userId));

  return c.json({ success: true });
});

app.post("/api/admin/users/:id/role", zValidator("json", updateUserSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, user.id));

  if (!dbUser || dbUser.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  const userId = c.req.param("id");
  const body = c.req.valid("json");

  await db
    .update(schema.user)
    .set(body)
    .where(eq(schema.user.id, userId));

  return c.json({ success: true });
});




app.get("/api/courses", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB);

  // Check if approved (unless admin)
  const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, user.id));
  if (!dbUser?.approved && dbUser?.role !== "admin") {
    return c.json({ courses: [] });
  }

  // Fetch all courses with trainer details (for simplicity just courses first)
  const courses = await db.select().from(schema.course);
  return c.json({ courses });
});

app.get("/api/my-enrollments", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const db = drizzle(c.env.DB);

  // Check if approved
  const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, user.id));
  if (!dbUser?.approved && dbUser?.role !== "admin") {
    return c.json({ enrollments: [] });
  }

  // Fetch enrollments for current user
  const enrollments = await db
    .select({
      enrollment: schema.enrollment,
      course: schema.course
    })
    .from(schema.enrollment)
    .innerJoin(schema.course, eq(schema.enrollment.courseId, schema.course.id))
    .where(eq(schema.enrollment.traineeId, user.id));

  return c.json({ enrollments });
});

app.post("/api/courses", zValidator("json", createCourseSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB);
  const [dbUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, user.id));

  if (!dbUser) {
    return c.json({ error: "User not found" }, 401);
  }

  // Role check: Only 'trainer' or 'admin' can create courses
  if ((dbUser.role !== "trainer" && dbUser.role !== "admin") || (!dbUser.approved && dbUser.role !== "admin")) {
    return c.json({ error: "Forbidden: Only approved trainers can create courses" }, 403);
  }

  const body = c.req.valid("json");

  const now = new Date();
  const newCourse = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description ?? null,
    trainerId: user.id,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.course).values(newCourse);

  return c.json({ course: newCourse }, 201);
});

app.post("/api/courses/:id/enroll", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB);
  const [dbUser] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, user.id));

  if (!dbUser) {
    return c.json({ error: "User not found" }, 401);
  }

  // Role check: Only 'trainee' can enroll
  if (dbUser.role !== "trainee") {
    return c.json({ error: "Forbidden: Only trainees can enroll in courses" }, 403);
  }

  if (!dbUser.approved) {
    return c.json({ error: "Forbidden: Account not approved" }, 403);
  }

  const courseId = c.req.param("id");

  // Check if course exists
  const [existingCourse] = await db.select().from(schema.course).where(eq(schema.course.id, courseId));
  if (!existingCourse) {
    return c.json({ error: "Course not found" }, 404);
  }

  // Check if already enrolled
  const [existingEnrollment] = await db
    .select()
    .from(schema.enrollment)
    .where(and(eq(schema.enrollment.courseId, courseId), eq(schema.enrollment.traineeId, user.id)));

  if (existingEnrollment) {
    return c.json({ error: "Already enrolled" }, 409);
  }

  const newEnrollment = {
    id: crypto.randomUUID(),
    courseId: courseId, // Ensure courseId is valid
    traineeId: user.id,
    enrolledAt: new Date(),
  };

  await db.insert(schema.enrollment).values(newEnrollment);

  return c.json({ enrollment: newEnrollment }, 201);
});

export default app;

app.post("/api/lectures", zValidator("json", createLectureSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, user.id));

  if (!dbUser || (dbUser.role !== "trainer" && dbUser.role !== "admin")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  if (!dbUser.approved && dbUser.role !== "admin") {
    return c.json({ error: "Forbidden: Account not approved" }, 403);
  }

  // TODO: Check if trainer teaches this course

  const body = c.req.valid("json");
  const newLecture = {
    id: crypto.randomUUID(),
    courseId: body.courseId,
    title: body.title,
    description: body.description ?? null,
    scheduledAt: new Date(body.scheduledAt),
    createdAt: new Date(),
  };

  await db.insert(schema.lecture).values(newLecture);
  return c.json({ lecture: newLecture }, 201);
});

app.post("/api/attendance", zValidator("json", markAttendanceSchema), async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, user.id));

  if (!dbUser || (dbUser.role !== "trainer" && dbUser.role !== "admin")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  if (!dbUser.approved && dbUser.role !== "admin") {
    return c.json({ error: "Forbidden: Account not approved" }, 403);
  }

  const body = c.req.valid("json");
  const newAttendance = {
    id: crypto.randomUUID(),
    lectureId: body.lectureId,
    traineeId: body.traineeId,
    status: body.status,
    markedAt: new Date(),
  };

  await db.insert(schema.attendance).values(newAttendance);
  return c.json({ attendance: newAttendance }, 201);
});
