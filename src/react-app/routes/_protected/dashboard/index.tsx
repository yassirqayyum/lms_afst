import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Users } from "lucide-react";

export const Route = createFileRoute("/_protected/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: sessionData } = useSession();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch full user details to get role
        const meRes = await fetch("/api/me");
        const meData = await meRes.json();
        const currentUser = meData.user;
        setUser(currentUser);

        if (currentUser?.role === "trainer" || currentUser?.role === "admin") {
          // Fetch managed courses
          const coursesRes = await fetch("/api/courses");
          const coursesData = await coursesRes.json();
          // Filter for trainer's courses
          // Note: In a real app the backend should filter, but for now we filter client side 
          // as the /api/courses returns all
          setCourses(coursesData.courses.filter((c: any) => c.trainerId === currentUser.id));
        } else {
          // Fetch enrollments
          const enrollRes = await fetch("/api/my-enrollments");
          const enrollData = await enrollRes.json();
          setCourses(enrollData.enrollments.map((e: any) => e.course));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sessionData]);

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
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            {user?.role === "trainer" && (
              <>
                <Button asChild>
                  <Link to="/courses/create">
                    <Plus className="mr-2 h-4 w-4" /> Create Course
                  </Link>
                </Button>
                <Button variant="outline" asChild className="ml-2">
                  <Link to="/users">
                    <Users className="mr-2 h-4 w-4" /> Students
                  </Link>
                </Button>
              </>
            )}
            {user?.role === "trainee" && (
              <Button variant="default" asChild>
                <Link to="/courses">
                  <BookOpen className="mr-2 h-4 w-4" /> Browse Courses
                </Link>
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {user?.role === "trainer" ? "Active Courses" : "Enrolled Courses"}
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses.length}</div>
              </CardContent>
            </Card>
            {/* Placeholder stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
          </div>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
            <Card className="col-span-7">
              <CardHeader>
                <CardTitle>{user?.role === "trainer" ? "My Courses" : "My Learning"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.length === 0 ? (
                    <p className="text-muted-foreground">
                      {user?.role === "trainer"
                        ? "You haven't created any courses yet."
                        : "You are not enrolled in any courses."}
                    </p>
                  ) : (
                    courses.map(course => (
                      <div key={course.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                        <div>
                          <h4 className="font-semibold">{course.title}</h4>
                          <p className="text-sm text-muted-foreground">{course.description || "No description"}</p>
                        </div>
                        {user?.role === "trainee" && (
                          <Button variant="outline" size="sm">Continue</Button>
                        )}
                        {user?.role === "trainer" && (
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
      </SidebarInset>
    </SidebarProvider>
  );
}
