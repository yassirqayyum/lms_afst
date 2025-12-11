import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/my-courses/")({
    component: MyCoursesPage,
});

function MyCoursesPage() {
    const navigate = useNavigate();
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEnrollments();
    }, []);

    async function fetchEnrollments() {
        try {
            const res = await fetch("/api/my-enrollments");
            const data = await res.json();
            setEnrollments(data.enrollments || []);
        } catch (error) {
            console.error("Failed to fetch enrollments", error);
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
                            <h2 className="text-3xl font-bold tracking-tight">My Courses</h2>
                            <p className="text-muted-foreground">
                                View and access your enrolled courses
                            </p>
                        </div>
                    </div>

                    {enrollments.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
                                <p className="text-muted-foreground text-center max-w-md">
                                    You haven't enrolled in any courses yet. Contact your administrator to get enrolled.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {enrollments.map((enrollment) => (
                                <Card key={enrollment.enrollment.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <CardTitle>{enrollment.course.title}</CardTitle>
                                        <CardDescription>{enrollment.course.description || "No description"}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Clock className="mr-2 h-4 w-4" />
                                                Enrolled {new Date(enrollment.enrollment.enrolledAt).toLocaleDateString()}
                                            </div>
                                            <Button
                                                className="w-full"
                                                onClick={() => navigate({ to: `/my-courses/${enrollment.course.id}` })}
                                            >
                                                View Course
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
