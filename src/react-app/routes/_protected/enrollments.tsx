import { useNavigate, createFileRoute } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_protected/enrollments")({
    component: EnrollmentsPage,
});

function EnrollmentsPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch courses
                const coursesRes = await fetch("/api/courses");
                if (!coursesRes.ok) {
                    const txt = await coursesRes.text();
                    console.error("Courses Fetch Failed:", txt); // For browser console
                    toast.error(`Failed to fetch courses: ${coursesRes.status}`);
                    setLoading(false);
                    return;
                }
                const coursesData = await coursesRes.json();
                const courses = coursesData.courses || [];
                console.log("Courses fetched:", courses); // Debug

                // Fetch enrollments
                const enrollmentsRes = await fetch("/api/enrollments");
                if (!enrollmentsRes.ok) {
                    const txt = await enrollmentsRes.text();
                    console.error("Enrollments Fetch Failed:", txt);
                    toast.error(`Failed to fetch enrollments: ${enrollmentsRes.status}`);
                    setLoading(false);
                    return;
                }
                const enrollmentsData = await enrollmentsRes.json();
                const enrollments = enrollmentsData.enrollments || [];
                console.log("Enrollments fetched:", enrollments); // Debug

                // Calculate stats
                const courseStats = courses.map((course: any) => {
                    const count = enrollments.filter((e: any) => e.courseId === course.id).length;
                    return {
                        ...course,
                        enrollmentCount: count
                    };
                });

                setStats(courseStats);
            } catch (error: any) {
                console.error("Fetch error:", error);
                toast.error(`Error loading data: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

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
                        <h2 className="text-3xl font-bold tracking-tight">Course Enrollments</h2>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Course Title</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">Total Students</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">Loading...</TableCell>
                                    </TableRow>
                                ) : stats.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">No courses found.</TableCell>
                                    </TableRow>
                                ) : (
                                    stats.map((course) => (
                                        <TableRow key={course.id}>
                                            <TableCell className="font-medium">{course.title}</TableCell>
                                            <TableCell className="max-w-[300px] truncate">{course.description}</TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                                    {course.enrollmentCount}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => navigate({ to: `/courses/${course.id}/enrollments` })}
                                                >
                                                    Manage Enrollments
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
