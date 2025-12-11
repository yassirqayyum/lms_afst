import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_protected/courses/")({
  component: CoursesPage,
});

function CoursesPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, coursesRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/courses"),
        ]);

        const userData = await userRes.json();
        const coursesData = await coursesRes.json();

        setCurrentUser(userData.user);
        setCourses(coursesData.courses || []);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
                {isAdmin ? "Manage Courses" : "My Assigned Courses"}
              </h2>
              <p className="text-muted-foreground">
                {isAdmin ? "View and manage all courses" : "Access and manage your teaching assignments"}
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => navigate({ to: "/courses/create" })}>
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            )}
          </div>

          <div className="rounded-md">
            {loading ? (
              <div className="text-center py-24 text-muted-foreground">Loading courses...</div>
            ) : courses.length === 0 ? (
              <div className="text-center py-24">
                <div className="flex justify-center mb-4">
                  <div className="bg-muted p-4 rounded-full">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold">No courses found</h3>
                <p className="text-muted-foreground">
                  {isAdmin ? "Create a course to get started." : "You have not been assigned to any courses yet."}
                </p>
              </div>
            ) : isAdmin ? (
              /* Admin Table View */
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      {/* <TableHead>Trainer Name</TableHead> */}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.description || "No description"}</TableCell>
                        {/* <TableCell>{course.trainerName || "-"}</TableCell> */}
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate({ to: `/courses/${course.id}` })}
                            >
                              Manage
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Trainer Grid View */
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <div key={course.id} className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow hover:shadow-lg transition-all duration-200">
                    <div className="p-6">
                      <h3 className="text-2xl font-semibold leading-none tracking-tight mb-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {course.description || "No description provided."}
                      </p>
                    </div>
                    <div className="p-6 pt-0 mt-auto">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {/* Placeholder for student count if we had it */}
                          {/* <span>12 Students</span> */}
                        </div>
                        <Button
                          className="w-full sm:w-auto"
                          onClick={() => navigate({ to: `/courses/${course.id}` })}
                        >
                          Manage Course
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
