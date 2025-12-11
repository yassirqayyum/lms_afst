import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileIcon, Download } from "lucide-react";

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
            const res = await fetch(`/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data.course);
                setLectures(data.lectures || []);
            }
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
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4" />
                                                        {new Date(lecture.scheduledAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Clock className="mr-2 h-4 w-4" />
                                                        {new Date(lecture.scheduledAt).toLocaleTimeString()}
                                                    </div>
                                                </div>

                                                {/* Lecture Materials */}
                                                {lecture.files && lecture.files.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t">
                                                        <p className="text-sm font-semibold mb-2">Course Materials</p>
                                                        <div className="space-y-2">
                                                            {lecture.files.map((file: any) => (
                                                                <div key={file.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                        <FileIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                                        <span className="text-sm truncate">{file.fileName}</span>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        asChild
                                                                    >
                                                                        <a
                                                                            href={`/api/lecture-files/${file.id}/download`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="flex items-center gap-1"
                                                                        >
                                                                            <Download className="h-4 w-4" />
                                                                            Download
                                                                        </a>
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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
