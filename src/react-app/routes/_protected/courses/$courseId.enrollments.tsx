import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { User } from "@/lib/types";

export const Route = createFileRoute("/_protected/courses/$courseId/enrollments")({
  component: CourseEnrollmentsPage,
});

function CourseEnrollmentsPage() {
  const { courseId } = Route.useParams();
  const [course, setCourse] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [trainees, setTrainees] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [selectedTrainees, setSelectedTrainees] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: session } = useSession();
  const currentUser = session?.user as unknown as User;
  const isTrainer = currentUser?.role === "trainer";

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

      const trainerList = usersData.users?.filter((u: any) => u.role === "trainer" && u.approved) || [];
      setTrainers(trainerList);

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

  const handleToggleTrainee = (traineeId: string) => {
    const newSelected = new Set(selectedTrainees);
    if (newSelected.has(traineeId)) {
      newSelected.delete(traineeId);
    } else {
      newSelected.add(traineeId);
    }
    setSelectedTrainees(newSelected);
  };

  const handleSelectAll = () => {
    const enrolledIds = new Set(enrollments.map(e => e.trainee.id));
    const availableTrainees = trainees.filter(t => !enrolledIds.has(t.id));

    if (selectedTrainees.size === availableTrainees.length) {
      setSelectedTrainees(new Set());
    } else {
      setSelectedTrainees(new Set(availableTrainees.map(t => t.id)));
    }
  };

  const handleBulkEnroll = async () => {
    if (selectedTrainees.size === 0) {
      toast.error("Please select at least one trainee");
      return;
    }

    if (!selectedInstructor) {
      toast.error("Please select an instructor");
      return;
    }

    setEnrolling(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traineeIds: Array.from(selectedTrainees),
          trainerId: selectedInstructor,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        if (data.results.errors.length > 0) {
          data.results.errors.forEach((err: any) => {
            toast.error(`${err.traineeId}: ${err.error}`);
          });
        }
        setSelectedTrainees(new Set());
        fetchData();
      } else {
        toast.error(data.error || "Failed to enroll trainees");
      }
    } catch (error) {
      toast.error("Error enrolling trainees");
    } finally {
      setEnrolling(false);
    }
  };

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

  const enrolledIds = new Set(enrollments.map(e => e.trainee.id));
  const availableTrainees = trainees.filter(t => !enrolledIds.has(t.id));

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
              <p className="text-muted-foreground">Course Enrollments</p>
            </div>
          </div>

          {/* Instructor Selection & Trainee Enrollment - Admin Only */}
          {!isTrainer && (
            <>
              <div className="rounded-lg border p-4 mb-4 bg-card grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Select Instructor</h3>
                  <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainers.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No approved trainers available
                        </SelectItem>
                      ) : (
                        trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.name} ({trainer.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Start Date</h3>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">End Date</h3>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="text-sm text-muted-foreground mb-4">
                Select the instructor and course duration (optional) before enrolling.
              </div>

              {availableTrainees.length > 0 && (
                <div className="rounded-lg border p-6 mb-4 bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Enroll Trainees</h3>
                    <div className="flex gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedTrainees.size} selected
                      </span>
                      <Button
                        onClick={handleBulkEnroll}
                        disabled={selectedTrainees.size === 0 || enrolling || !selectedInstructor}
                        size="sm"
                      >
                        {enrolling ? "Enrolling..." : `Enroll Selected (${selectedTrainees.size})`}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={selectedTrainees.size === availableTrainees.length && availableTrainees.length > 0}
                              onChange={handleSelectAll}
                              className="cursor-pointer"
                            />
                          </TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableTrainees.map((trainee) => (
                          <TableRow key={trainee.id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedTrainees.has(trainee.id)}
                                onChange={() => handleToggleTrainee(trainee.id)}
                                className="cursor-pointer"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{trainee.name}</TableCell>
                            <TableCell>{trainee.email}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="rounded-md border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Enrolled Students ({enrollments.length})</h3>
            </div>
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
                        {!isTrainer && (
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
