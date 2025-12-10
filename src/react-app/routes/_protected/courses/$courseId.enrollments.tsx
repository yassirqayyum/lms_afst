import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_protected/courses/$courseId/enrollments")({
  component: CourseEnrollmentsPage,
});

function CourseEnrollmentsPage() {
  const { courseId } = Route.useParams();
  const [course, setCourse] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [coursesRes, usersRes, enrollmentsRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/users"),
        fetch(`/api/courses/${courseId}/enrollments`),
      ]);

      const coursesData = await coursesRes.json();
      const usersData = await usersRes.json();
      const enrollmentsData = await enrollmentsRes.json();

      const currentCourse = coursesData.courses?.find((c: any) => c.id === courseId);
      setCourse(currentCourse);

      const traineeList = usersData.users?.filter((u: any) => u.role === "trainee" && u.approved) || [];
      setTrainees(traineeList);

      setEnrollments(enrollmentsData.enrollments || []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleEnroll() {
    if (!selectedTrainee) {
      toast.error("Please select a trainee");
      return;
    }

    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ traineeId: selectedTrainee }),
      });

      if (res.ok) {
        toast.success("Trainee enrolled successfully");
        setSelectedTrainee("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to enroll trainee");
      }
    } catch (error) {
      toast.error("Error enrolling trainee");
    }
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">Loading...</div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!course) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">Course not found</div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
              <h2 className="text-3xl font-bold tracking-tight">{course.title}</h2>
              <p className="text-muted-foreground">Manage Enrollments</p>
            </div>
          </div>

          <div className="rounded-lg border p-4 mb-4">
            <h3 className="text-lg font-semibold mb-4">Enroll Trainee</h3>
            <div className="flex gap-4">
              <Select value={selectedTrainee} onValueChange={setSelectedTrainee}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a trainee" />
                </SelectTrigger>
                <SelectContent>
                  {trainees.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No approved trainees available
                    </SelectItem>
                  ) : (
                    trainees.map((trainee) => (
                      <SelectItem key={trainee.id} value={trainee.id}>
                        {trainee.name} ({trainee.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleEnroll}>Enroll</Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Enrolled At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No enrollments yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>{enrollment.trainee.name}</TableCell>
                      <TableCell>{enrollment.trainee.email}</TableCell>
                      <TableCell>{new Date(enrollment.enrolledAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
