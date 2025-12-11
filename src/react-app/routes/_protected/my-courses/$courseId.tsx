import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";

export const Route = createFileRoute("/_protected/my-courses/$courseId")({
    component: TraineeCourseDetailPage,
});

function TraineeCourseDetailPage() {
    const { courseId } = Route.useParams();
    const [course, setCourse] = useState<any>(null);
    const [lectures, setLectures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    async function fetchCourseData() {
        try {
            const [coursesRes, lecturesRes] = await Promise.all([
                fetch("/api/my-enrollments"),
                fetch(`/api/courses/${courseId}/lectures`),
            ]);

            const coursesData = await coursesRes.json();
            const lecturesData = await lecturesRes.json();

            const enrollment = coursesData.enrollments?.find((e: any) => e.course.id === courseId);
            if (enrollment) {
                setCourse(enrollment.course);
            }

            setLectures(lecturesData.lectures || []);
        } catch (error) {
            console.error("Failed to fetch course data", error);
        } finally {
            setLoading(false);
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
                    <div className="flex h-screen items-center justify-center">
                        Course not found or you're not enrolled
                    </div>
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
                            <p className="text-muted-foreground">{course.description}</p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Course Lectures</CardTitle>
                            <CardDescription>
                                Access your course materials and lecture content
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {lectures.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No lectures scheduled yet
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {lectures.map((lecture: any) => (
                                        <Card key={lecture.id} className="hover:shadow-md transition-shadow">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">{lecture.title}</CardTitle>
                                                        <CardDescription>{lecture.description}</CardDescription>
                                                    </div>
                                                    <Badge variant="outline">
                                                        {new Date(lecture.scheduledAt) > new Date() ? "Upcoming" : "Past"}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        {new Date(lecture.scheduledAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Clock className="mr-2 h-4 w-4" />
                                                        {new Date(lecture.scheduledAt).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
