import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Route = createFileRoute("/_protected/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalTrainers: 0,
    totalTrainees: 0,
    totalEnrollments: 0,
    totalUsers: 0,
  });
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [meRes, coursesRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/courses"),
        ]);

        const meData = await meRes.json();
        const coursesData = await coursesRes.json();

        setCurrentUser(meData.user);
        setCourses(coursesData.courses || []);

        if (meData.user?.role === "admin") {
          const [statsRes, enrollChartRes, attendanceChartRes] = await Promise.all([
            fetch("/api/admin/stats"),
            fetch("/api/admin/charts/enrollments"),
            fetch("/api/admin/charts/attendance"),
          ]);

          const statsData = await statsRes.json();
          const enrollChartData = await enrollChartRes.json();
          const attendanceChartData = await attendanceChartRes.json();

          setStats(statsData);
          setEnrollmentData(enrollChartData.data || []);
          setAttendanceData(attendanceChartData.data || []);
        } else if (meData.user?.role === "trainee") {
          // Trainee specific fetch
          const [dashRes, enrollRes] = await Promise.all([
            fetch("/api/trainee/dashboard"),
            fetch("/api/my-enrollments")
          ]);

          if (dashRes.ok) {
            const dashData = await dashRes.json();
            // Overload stats for trainee view reusing existing state or add new state?
            // Existing stats state structure is designed for Admin.
            // I should probably add specific trainee state or just map it.
            setStats(prev => ({
              ...prev,
              totalCourses: dashData.totalCourses,
              totalTrainers: 0, // unused
              totalTrainees: 0, // unused
              totalEnrollments: 0, // unused
              totalUsers: 0, // unused
              attendanceRate: dashData.attendanceRate, // Adding dynamic prop
              upcomingLectures: dashData.upcomingLectures, // Adding dynamic prop
            } as any));
          }

          if (enrollRes.ok) {
            const enrollData = await enrollRes.json();
            setCourses(enrollData.enrollments.map((e: any) => e.course));
          }

        } else {
          // Trainer (fallback/existing)
          setStats({
            totalCourses: coursesData.courses?.length || 0,
            totalTrainers: 0,
            totalTrainees: 0,
            totalEnrollments: 0,
            totalUsers: 0,
          });
          // Trainer courses usually via /api/courses but filtered or /api/trainer/courses
          // Trainer courses usually via /api/courses but filtered or /api/trainer/courses
          // const enrollRes = await fetch("/api/my-enrollments"); 
          // Trainer logic was "fallback" in original code.
          // For now, let's leave Trainer as is (it was just setting courses from /api/courses which lists all courses? No, lines 69 maps enrollments)
          // Actually original code lines 59-70 handle "else" which includes Trainer?
          // No, lines 60-70 fetch /api/my-enrollments. Trainers don't have enrollments as student.
          // Trainer should see courses they TEACH.
          // I'll leave strictly Trainee updates here to avoid breaking Trainer if logic was shaky.
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-screen items-center justify-center">Loading dashboard...</div>
      </SidebarInset>
    </SidebarProvider>
  );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between space-y-2 py-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {currentUser?.role === "admin" ? "Admin Dashboard" :
                  currentUser?.role === "trainer" ? "Trainer Dashboard" :
                    "My Learning"}
              </h2>
              <p className="text-muted-foreground">
                {currentUser?.role === "admin" ? "Overview of system performance and activity." :
                  currentUser?.role === "trainer" ? "Manage your courses and students." :
                    "Track your progress and upcoming lessons."}
              </p>
            </div>

            {(currentUser?.role === "trainer") && (
              <div className="flex items-center space-x-2">
                <Button>Schedule Lecture</Button>
              </div>
            )}
            {currentUser?.role === "trainee" && currentUser?.approved && (
              <Button variant="default" onClick={() => navigate({ to: "/courses" })}>
                <BookOpen className="mr-2 h-4 w-4" /> Browse Courses
              </Button>
            )}
          </div>

          {!currentUser?.approved && currentUser?.role !== "admin" ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200">
              <h3 className="text-lg font-semibold">Account Pending Approval</h3>
              <p className="text-sm">
                {currentUser?.role === "trainer" ? " You cannot manage courses or students yet." : " You cannot view courses or lectures yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {currentUser?.role === "admin" ? (
                  <>
                    <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.totalCourses}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Active learning programs
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-chart-1 hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Trainers</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-chart-1/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-chart-1" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.totalTrainers}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Expert instructors
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-chart-2 hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Trainees</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-chart-2/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-chart-2" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.totalTrainees}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Active learners
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-chart-3 hover:shadow-lg transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
                        <div className="h-10 w-10 rounded-full bg-chart-3/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-chart-3" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{stats.totalEnrollments}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Course registrations
                        </p>
                      </CardContent>
                    </Card>
                  </>
                ) : currentUser?.role === "trainer" ? (
                  <>
                    <Card
                      className="cursor-pointer hover:shadow-md transition-all"
                      onClick={() => navigate({ to: "/courses" })}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Active Courses
                        </CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{courses.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Manage evaluations</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        {/* Placeholder for trainer metrics */}
                        <CardTitle className="text-sm font-medium">
                          Completion Rate
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">0%</div>
                        <p className="text-xs text-muted-foreground">Start learning today!</p>
                      </CardContent>
                    </Card>
                  </>
                ) : currentUser?.role === "trainee" ? (
                  <>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          My Courses
                        </CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{(stats as any).totalCourses || 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Attendance Rate
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{(stats as any).attendanceRate || 0}%</div>
                        <p className="text-xs text-muted-foreground">Keep it up!</p>
                      </CardContent>
                    </Card>
                    {/* Upcoming Lectures */}
                    <Card className="col-span-2">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          Upcoming Lectures
                        </CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        {((stats as any).upcomingLectures && (stats as any).upcomingLectures.length > 0) ? (
                          <div className="space-y-4 pt-4">
                            {(stats as any).upcomingLectures.map((l: any) => (
                              <div key={l.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                <div>
                                  <div className="font-medium text-sm">{l.title}</div>
                                  <div className="text-xs text-muted-foreground">{l.courseTitle}</div>
                                </div>
                                <div className="text-xs font-mono">
                                  {new Date(l.scheduledAt).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground pt-4">No upcoming lectures.</div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : null}
              </div>

              {currentUser?.role === "admin" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-4">
                    <CardHeader>
                      <CardTitle>Enrollment Trends</CardTitle>
                      <CardDescription>
                        Monthly student enrollments over the last 6 months
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={enrollmentData}>
                          <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                          />
                          <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="col-span-3">
                    <CardHeader>
                      <CardTitle>Attendance Overview</CardTitle>
                      <CardDescription>
                        Recent attendance status distribution
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={attendanceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {attendanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                <Card className="col-span-7">
                  <CardHeader>
                    <CardTitle>{currentUser?.role === "trainer" ? "My Courses" : currentUser?.role === "trainee" ? "My Learning" : "Recent Activity"}</CardTitle>
                    {currentUser?.role === "admin" && <CardDescription>Latest system events and updates</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {courses.length === 0 && currentUser?.role !== "admin" ? (
                        <p className="text-muted-foreground">
                          {currentUser?.role === "trainer"
                            ? "You haven't created any courses yet."
                            : "You are not enrolled in any courses."}
                        </p>
                      ) : currentUser?.role === "admin" ? (
                        <div className="space-y-4">
                          {/* Placeholder for recent activity - could be real data later */}
                          <div className="flex items-center">
                            <div className="ml-4 space-y-1">
                              <p className="text-sm font-medium leading-none">System Initialized</p>
                              <p className="text-sm text-muted-foreground">The LMS platform is ready for use.</p>
                            </div>
                            <div className="ml-auto font-medium text-muted-foreground text-sm">Just now</div>
                          </div>
                        </div>
                      ) : (
                        courses.map(course => (
                          <div key={course.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                            <div>
                              <h4 className="font-semibold">{course.title}</h4>
                              <p className="text-sm text-muted-foreground">{course.description || "No description"}</p>
                            </div>
                            {currentUser?.role === "trainee" && (
                              <Button variant="outline" size="sm">Continue</Button>
                            )}
                            {currentUser?.role === "trainer" && (
                              <Button variant="secondary" size="sm">Manage</Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
