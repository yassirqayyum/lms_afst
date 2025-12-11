import { Hono } from "hono";
import { getAuth } from "./lib/auth";
import { zValidator } from "@hono/zod-validator";
import { eq, and, inArray, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { z } from "zod";
import * as schema from "./db/schema";
import { getAuthUser } from "./lib/get-auth-user";

const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  trainerId: z.string().min(1, "Trainer ID is required"),
});

const createEnrollmentSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  traineeId: z.string().min(1, "Trainee ID is required"),
  trainerId: z.string().min(1, "Trainer ID is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
// ... 
const app = new Hono<{ Bindings: Env }>();

// Create Enrollment
app.post("/api/enrollments", async (c) => {
  const user = await getAuthUser(c);
  if (!user || (user as any).role !== "admin") return c.json({ error: "Forbidden" }, 403);

  const body = await c.req.json();
  const validation = createEnrollmentSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: "Invalid input", details: validation.error }, 400);
  }

  const { courseId, traineeId, trainerId, startDate, endDate } = validation.data;
  const db = drizzle(c.env.DB);
  const existing = await db.select().from(schema.enrollment)
    .where(and(
      eq(schema.enrollment.courseId, courseId),
      eq(schema.enrollment.userId, traineeId)
    ));

  if (existing.length > 0) return c.json({ error: "Already enrolled" }, 400);

  const enrollmentId = crypto.randomUUID();
  await db.insert(schema.enrollment).values({
    id: enrollmentId,
    courseId,
    userId: traineeId,
    trainerId,
    enrolledAt: new Date(),
    startDate: startDate || null,
    endDate: endDate || null,
  });

  return c.json({ success: true, id: enrollmentId });
});

// Get Enrollments (for Admin)
app.get("/api/enrollments", async (c) => {
  const user = await getAuthUser(c);
  if (!user || (user as any).role !== "admin") return c.json({ error: "Forbidden" }, 403);

  const db = drizzle(c.env.DB);

  // Join logic to get names
  const enrollments = await db.select({
    id: schema.enrollment.id,
    courseId: schema.enrollment.courseId,
    traineeId: schema.enrollment.userId,
    trainerId: schema.enrollment.trainerId,
    enrolledAt: schema.enrollment.enrolledAt,
    startDate: schema.enrollment.startDate,
    endDate: schema.enrollment.endDate,
    courseName: schema.course.title,
    traineeName: schema.user.name,
    traineeEmail: schema.user.email,
    // We need a way to get trainer name. 
    // Simple join with user table again? Drizzle allows aliasing but basic select join might collide on 'user'.
  }).from(schema.enrollment)
    .leftJoin(schema.course, eq(schema.enrollment.courseId, schema.course.id))
    .leftJoin(schema.user, eq(schema.enrollment.userId, schema.user.id));

  // Fetch trainers separately or use alias (alias in TS Drizzle is nicer)
  // Quick fix: Fetch all trainers and map, or optimize later. 
  // Given the task, let's just fetch all users and map in memory for the response if dataset small, 
  // OR use a raw query or alias. Let's do a separate fetch for trainer names to keep it simple and type-safe without alias complexity right now.

  const trainerIds = enrollments.map(e => e.trainerId).filter(Boolean);
  let trainersMap: Record<string, string> = {};
  if (trainerIds.length > 0) {
    const trainers = await db.select().from(schema.user).where(inArray(schema.user.id, trainerIds));
    trainers.forEach(t => trainersMap[t.id] = t.name);
  }

  const enriched = enrollments.map(e => ({
    ...e,
    trainerName: trainersMap[e.trainerId] || "Unknown"
  }));

  return c.json({ enrollments: enriched });
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

app.get("/api/trainers", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB);
  // Only admin can view trainers list
  const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, user.id));
  if (dbUser?.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Get all trainers
  const trainers = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
    })
    .from(schema.user)
    .where(eq(schema.user.role, "trainer"));

  return c.json({ trainers });
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

  // Fetch all courses
  if (dbUser.role === "trainer") {
    // For trainers, only show courses where they are assigned via enrollment
    const courses = await db
      .selectDistinct({
        id: schema.course.id,
        title: schema.course.title,
        description: schema.course.description,
        trainerId: schema.course.trainerId,
        createdAt: schema.course.createdAt,
        updatedAt: schema.course.updatedAt,
      })
      .from(schema.course)
      .innerJoin(schema.enrollment, eq(schema.course.id, schema.enrollment.courseId))
      .where(eq(schema.enrollment.trainerId, user.id));

    return c.json({ courses });
  }

  // For Admin (and others if approved? logic says 'if not approved && not admin return empty', so here we are approved or admin)
  // Admin sees all
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
    .where(eq(schema.enrollment.userId, user.id));

  return c.json({ enrollments });
});

app.get("/api/courses/:id/enrollments", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB);
  const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, user.id));

  // Only admin and trainers can view course enrollments
  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "trainer")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const courseId = c.req.param("id");

  // Fetch enrollments with trainee details
  const enrollments = await db
    .select({
      id: schema.enrollment.id,
      enrolledAt: schema.enrollment.enrolledAt,
      trainee: schema.user,
    })
    .from(schema.enrollment)
    .innerJoin(schema.user, eq(schema.enrollment.userId, schema.user.id))
    .where(eq(schema.enrollment.courseId, courseId));

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

  // Role check: Only 'admin' can create courses (with trainer assignment)
  if (dbUser.role !== "admin") {
    return c.json({ error: "Forbidden: Only admins can create courses" }, 403);
  }

  const body = c.req.valid("json");

  const now = new Date();
  const newCourse = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description ?? null,
    trainerId: body.trainerId,
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

  const courseId = c.req.param("id");

  // Get traineeId from body (for admin) or use current user (for trainee)
  let traineeId = user.id;
  let trainerId: string | undefined;
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (dbUser.role === "admin") {
    // Admin can enroll any trainee
    const body = await c.req.json();
    traineeId = body.traineeId || user.id;
    trainerId = body.trainerId;
    startDate = body.startDate;
    endDate = body.endDate;
  } else if (dbUser.role === "trainee") {
    // Trainee can only enroll themselves
    // TODO: Trainees cannot pick a trainer in this flow yet (unless UI allows). 
    // For now assuming Admin flow or trainee self-enroll (which might need a default trainer or UI update).
    // Given the request, "No need of assigning trainer on course creation, this should be done in course enrollment".
    // If a trainee enrols themselves, they MUST pick a trainer.
    const body = await c.req.json().catch(() => ({}));
    trainerId = body.trainerId;
    startDate = body.startDate;
    endDate = body.endDate;

    if (!dbUser.approved) {
      return c.json({ error: "Forbidden: Account not approved" }, 403);
    }
  } else {
    return c.json({ error: "Forbidden: Only trainees and admins can enroll" }, 403);
  }

  if (!trainerId) {
    return c.json({ error: "Trainer is required for enrollment" }, 400);
  }

  // Check if course exists
  const [existingCourse] = await db.select().from(schema.course).where(eq(schema.course.id, courseId));
  if (!existingCourse) {
    return c.json({ error: "Course not found" }, 404);
  }

  // Check if already enrolled
  const [existingEnrollment] = await db
    .select()
    .from(schema.enrollment)
    .where(and(eq(schema.enrollment.courseId, courseId), eq(schema.enrollment.userId, traineeId)));

  if (existingEnrollment) {
    return c.json({ error: "Already enrolled" }, 409);
  }

  const newEnrollment = {
    id: crypto.randomUUID(),
    courseId: courseId,
    userId: traineeId,
    trainerId: trainerId,
    enrolledAt: new Date(),
    startDate: startDate || null,
    endDate: endDate || null
  };

  await db.insert(schema.enrollment).values(newEnrollment);

  return c.json({ enrollment: newEnrollment }, 201);
});

app.post("/api/courses/:id/enroll-bulk", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB);
  const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, user.id));

  if (!dbUser || dbUser.role !== "admin") {
    return c.json({ error: "Forbidden: Only admins can bulk enroll" }, 403);
  }

  const courseId = c.req.param("id");
  const body = await c.req.json();
  const traineeIds = body.traineeIds as string[];
  const trainerId = body.trainerId as string;
  const startDate = body.startDate as string | undefined;
  const endDate = body.endDate as string | undefined;

  if (!traineeIds || !Array.isArray(traineeIds) || traineeIds.length === 0) {
    return c.json({ error: "traineeIds array is required" }, 400);
  }

  if (!trainerId) {
    return c.json({ error: "trainerId is required" }, 400);
  }

  // Check if course exists
  const [existingCourse] = await db.select().from(schema.course).where(eq(schema.course.id, courseId));
  if (!existingCourse) {
    return c.json({ error: "Course not found" }, 404);
  }

  // Check if trainer exists
  const [trainer] = await db.select().from(schema.user).where(eq(schema.user.id, trainerId));
  if (!trainer || trainer.role !== "trainer") {
    return c.json({ error: "Invalid trainer selected" }, 400);
  }

  const results = {
    success: [] as string[],
    errors: [] as { traineeId: string; error: string }[],
  };

  for (const traineeId of traineeIds) {
    try {
      // Check if trainee exists and is approved
      const [trainee] = await db.select().from(schema.user).where(eq(schema.user.id, traineeId));

      if (!trainee) {
        results.errors.push({ traineeId, error: "Trainee not found" });
        continue;
      }

      if (trainee.role !== "trainee") {
        results.errors.push({ traineeId, error: "User is not a trainee" });
        continue;
      }

      if (!trainee.approved) {
        results.errors.push({ traineeId, error: "Trainee not approved" });
        continue;
      }

      // Check if already enrolled
      const [existingEnrollment] = await db
        .select()
        .from(schema.enrollment)
        .where(and(eq(schema.enrollment.courseId, courseId), eq(schema.enrollment.userId, traineeId)));

      if (existingEnrollment) {
        results.errors.push({ traineeId, error: "Already enrolled" });
        continue;
      }

      // Enroll the trainee
      const newEnrollment = {
        id: crypto.randomUUID(),
        courseId: courseId,
        userId: traineeId,
        trainerId: trainerId,
        enrolledAt: new Date(),
        startDate: startDate || null,
        endDate: endDate || null
      };

      await db.insert(schema.enrollment).values(newEnrollment);
      results.success.push(traineeId);
    } catch (error) {
      results.errors.push({ traineeId, error: "Failed to enroll" });
    }
  }

  return c.json({
    message: `Enrolled ${results.success.length} out of ${traineeIds.length} trainees`,
    results,
  }, 200);
});

// Trainee Dashboard API
app.get("/api/trainee/dashboard", async (c) => {
  const user = await getAuthUser(c);
  if (!user || (user as any).role !== "trainee") return c.json({ error: "Forbidden" }, 403);

  const db = drizzle(c.env.DB);

  // 1. Get Enrollments
  const enrollments = await db
    .select({
      course: schema.course,
      enrollment: schema.enrollment,
    })
    .from(schema.enrollment)
    .innerJoin(schema.course, eq(schema.enrollment.courseId, schema.course.id))
    .where(eq(schema.enrollment.userId, user.id));

  // 2. Get Overall Attendance
  const attendance = await db
    .select()
    .from(schema.attendance)
    .where(eq(schema.attendance.traineeId, user.id));

  const attendanceCount = attendance.length;
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attendanceRate = attendanceCount > 0 ? (presentCount / attendanceCount) * 100 : 0;

  // 3. Get Upcoming Lectures
  const courseIds = enrollments.map(e => e.course.id);
  let upcomingLectures: any[] = [];

  if (courseIds.length > 0) {
    const allLectures = await db
      .select({
        id: schema.lecture.id,
        title: schema.lecture.title,
        scheduledAt: schema.lecture.scheduledAt,
        courseTitle: schema.course.title,
      })
      .from(schema.lecture)
      .innerJoin(schema.course, eq(schema.lecture.courseId, schema.course.id))
      .where(inArray(schema.lecture.courseId, courseIds))
      .orderBy(asc(schema.lecture.scheduledAt)); // We need to filter for future dates

    const now = new Date();
    upcomingLectures = allLectures.filter(l => new Date(l.scheduledAt) > now).slice(0, 5);
  }

  return c.json({
    totalCourses: enrollments.length,
    attendanceRate: Math.round(attendanceRate),
    upcomingLectures,
    recentActivity: [], // Placeholder
  });
});

app.get("/api/admin/stats", async (c) => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = drizzle(c.env.DB);
  const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, user.id));

  if (!dbUser || dbUser.role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }

  // Get real-time statistics from database
  const [courses, users, enrollments, lectures, attendanceRecords] = await Promise.all([
    db.select().from(schema.course),
    db.select().from(schema.user),
    db.select().from(schema.enrollment),
    db.select().from(schema.lecture),
    db.select().from(schema.attendance),
  ]);

  const trainers = users.filter(u => u.role === "trainer" && u.approved);
  const trainees = users.filter(u => u.role === "trainee" && u.approved);

  return c.json({
    totalCourses: courses.length,
    totalTrainers: trainers.length,
    totalTrainees: trainees.length,
    totalEnrollments: enrollments.length,
    totalLectures: lectures.length,
    totalAttendance: attendanceRecords.length,
  });
});

// Admin Chart API - Enrollment Trends
app.get("/api/admin/charts/enrollments", async (c) => {
  const user = await getAuthUser(c);
  if (!user || (await isNotAdmin(c, user))) return c.json({ error: "Forbidden" }, 403);

  const db = drizzle(c.env.DB);
  const enrollments = await db.select().from(schema.enrollment);

  // Group by month (last 6 months)
  const months: Record<string, number> = {};
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = d.toLocaleString('default', { month: 'short' });
    months[key] = 0;
  }

  enrollments.forEach(e => {
    const d = new Date(e.enrolledAt);
    const key = d.toLocaleString('default', { month: 'short' });
    if (months[key] !== undefined) {
      months[key]++;
    }
  });

  const data = Object.entries(months).map(([name, value]) => ({ name, value }));
  return c.json({ data });
});

// Admin Chart API - Attendance Overview
app.get("/api/admin/charts/attendance", async (c) => {
  const user = await getAuthUser(c);
  if (!user || (await isNotAdmin(c, user))) return c.json({ error: "Forbidden" }, 403);

  const db = drizzle(c.env.DB);
  const attendance = await db.select().from(schema.attendance);

  const counts = {
    present: 0,
    absent: 0,
    late: 0
  };

  attendance.forEach(a => {
    if (a.status === 'present') counts.present++;
    else if (a.status === 'absent') counts.absent++;
    else if (a.status === 'late') counts.late++;
  });

  const data = [
    { name: 'Present', value: counts.present, fill: '#22c55e' }, // green-500
    { name: 'Absent', value: counts.absent, fill: '#ef4444' }, // red-500
    { name: 'Late', value: counts.late, fill: '#eab308' }, // yellow-500
  ];

  return c.json({ data });
});

// Helper to check admin role
async function isNotAdmin(c: any, user: any) {
  const db = drizzle(c.env.DB);
  const [dbUser] = await db.select().from(schema.user).where(eq(schema.user.id, user.id));
  return !dbUser || dbUser.role !== "admin";
}


// Enrollment Schemas



// Get Single Course with Lectures
app.get("/api/courses/:id", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const courseId = c.req.param("id");
  const db = drizzle(c.env.DB);

  const [course] = await db.select().from(schema.course).where(eq(schema.course.id, courseId));
  if (!course) return c.json({ error: "Course not found" }, 404);

  // Get lectures
  const lectures = await db
    .select()
    .from(schema.lecture)
    .where(eq(schema.lecture.courseId, courseId))
    .orderBy(schema.lecture.scheduledAt);

  const lectureIds = lectures.map(l => l.id);
  let files: any[] = [];

  if (lectureIds.length > 0) {
    files = await db
      .select()
      .from(schema.lectureFile)
      .where(inArray(schema.lectureFile.lectureId, lectureIds));
  }

  // Attach files to lectures
  const lecturesWithFiles = lectures.map(l => ({
    ...l,
    files: files.filter(f => f.lectureId === l.id)
  }));

  return c.json({ course, lectures: lecturesWithFiles });
});


// Upload Lecture Material
app.post("/api/lectures/:id/files", async (c) => {
  const user = await getAuthUser(c);
  if (!user || (user as any).role !== "trainer") return c.json({ error: "Forbidden" }, 403);

  const lectureId = c.req.param("id");
  const body = await c.req.parseBody();
  const file = body['file'];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "File is required" }, 400);
  }

  const fileId = crypto.randomUUID();
  const fileKey = `lectures/${lectureId}/${fileId}-${file.name}`;

  // Upload to R2
  // We assume R2 binding is named 'R2'
  try {
    await (c.env as any).R2.put(fileKey, file);
  } catch (e) {
    return c.json({ error: "Failed to upload to storage" }, 500);
  }

  const db = drizzle(c.env.DB);
  await db.insert(schema.lectureFile).values({
    id: fileId,
    lectureId,
    fileName: file.name,
    fileUrl: fileKey, // Storing key as URL for now
    fileType: file.type,
    fileSize: file.size,
    uploadedAt: new Date(),
  });

  return c.json({ success: true, fileId });
});

// Download/View Lecture Material
app.get("/api/lecture-files/:id/download", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const fileId = c.req.param("id");
  const db = drizzle(c.env.DB);
  const [fileRecord] = await db.select().from(schema.lectureFile).where(eq(schema.lectureFile.id, fileId));

  if (!fileRecord) return c.json({ error: "File not found" }, 404);

  // Check access: Trainer (owner?) or Trainee enrolled in course
  // Simplification: Any enrolled trainee or any trainer/admin can view for now
  // For stricter access, join with lecture -> course -> enrollment

  const object = await (c.env as any).R2.get(fileRecord.fileUrl);
  if (!object) return c.json({ error: "File object not found" }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Content-Disposition", `attachment; filename="${fileRecord.fileName}"`);

  return new Response(object.body, { headers });
});

// Delete Lecture Material
app.delete("/api/lecture-files/:id", async (c) => {
  const user = await getAuthUser(c);
  if (!user || (user as any).role !== "trainer") return c.json({ error: "Forbidden" }, 403);

  const fileId = c.req.param("id");
  const db = drizzle(c.env.DB);
  const [fileRecord] = await db.select().from(schema.lectureFile).where(eq(schema.lectureFile.id, fileId));

  if (!fileRecord) return c.json({ error: "File not found" }, 404);

  try {
    await (c.env as any).R2.delete(fileRecord.fileUrl);
  } catch (e) {
    console.error("R2 delete failed", e);
  }

  await db.delete(schema.lectureFile).where(eq(schema.lectureFile.id, fileId));

  return c.json({ success: true });
});

// Mark Attendance

app.post("/api/lectures/:id/attendance", async (c) => {
  const user = await getAuthUser(c);
  if (!user || (user as any).role !== "trainer") return c.json({ error: "Forbidden" }, 403);

  const lectureId = c.req.param("id");
  const { traineeId, status } = await c.req.json(); // status: 'present', 'absent', 'late'
  const db = drizzle(c.env.DB);

  // Verify lecture exists (optional but good)
  // Check if attendance already exists
  const [existing] = await db
    .select()
    .from(schema.attendance)
    .where(and(eq(schema.attendance.lectureId, lectureId), eq(schema.attendance.traineeId, traineeId)));

  if (existing) {
    await db
      .update(schema.attendance)
      .set({ status, markedAt: new Date() })
      .where(eq(schema.attendance.id, existing.id));
  } else {
    await db.insert(schema.attendance).values({
      id: crypto.randomUUID(),
      lectureId,
      traineeId,
      status,
      markedAt: new Date(),
    });
  }

  return c.json({ success: true });
});

// Get Lecture Attendance
app.get("/api/lectures/:id/attendance", async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const lectureId = c.req.param("id");
  const db = drizzle(c.env.DB);

  const attendance = await db
    .select({
      id: schema.attendance.id,
      traineeId: schema.attendance.traineeId,
      status: schema.attendance.status,
      traineeName: schema.user.name,
      traineeEmail: schema.user.email,
    })
    .from(schema.attendance)
    .leftJoin(schema.user, eq(schema.attendance.traineeId, schema.user.id))
    .where(eq(schema.attendance.lectureId, lectureId));

  return c.json({ attendance });
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
  return c.json({ lectureId: newLecture.id, lecture: newLecture }, 201);
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
