
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Calendar, CheckCircle, Upload, FileIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";


import { User } from "@/lib/types";

export const Route = createFileRoute("/_protected/courses/$courseId/")({
    component: CourseDetailPage,
});

function CourseDetailPage() {
    const { courseId } = Route.useParams();
    const [course, setCourse] = useState<any>(null);
    const [lectures, setLectures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newLectureTitle, setNewLectureTitle] = useState("");
    const [newLectureDate, setNewLectureDate] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Attendance states
    const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
    const [selectedLecture, setSelectedLecture] = useState<any>(null);
    const [trainees, setTrainees] = useState<any[]>([]);
    const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});

    const { data: session } = useSession();
    const currentUser = session?.user as unknown as User;

    const isTrainer = currentUser?.role === "trainer" || currentUser?.role === "admin";

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data.course);
                setLectures(data.lectures);
            } else {
                toast.error("Failed to load course");
            }

            // If trainer, fetch trainees for attendance
            if (isTrainer) {
                // Ideally this should be /api/courses/:id/enrollments
                // using /api/enrollments endpoint and filter client side.
                const enrollRes = await fetch("/api/enrollments");
                if (enrollRes.ok) {
                    await enrollRes.json();
                    // courseEnrollments unused, removing

                    // QUICK FIX: Fetch all users for now (Trainees).
                    const usersRes = await fetch("/api/users");
                    if (usersRes.ok) {
                        const uData = await usersRes.json();
                        setTrainees(uData.users.filter((u: any) => u.role === "trainee"));
                    }
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) fetchData();
    }, [courseId, isTrainer]);

    const [newLectureFile, setNewLectureFile] = useState<File | null>(null);
    const [creating, setCreating] = useState(false);

    const handleCreateLecture = async () => {
        if (!newLectureTitle || !newLectureDate) {
            toast.error("Please fill in title and date");
            return;
        }

        setCreating(true);
        try {
            // 1. Create Lecture
            const res = await fetch("/api/lectures", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId,
                    title: newLectureTitle,
                    scheduledAt: new Date(newLectureDate).toISOString(),
                }),
            });

            if (!res.ok) throw new Error("Failed to create lecture");

            const data = await res.json();
            const lectureId = data.lectureId || data.id; // API might return different field

            // 2. Upload File if present
            if (newLectureFile && lectureId) {
                const formData = new FormData();
                formData.append("file", newLectureFile);

                const uploadRes = await fetch(`/api/lectures/${lectureId}/files`, {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) toast.error("Lecture created but file upload failed");
                else toast.success("Lecture and file created");
            } else {
                toast.success("Lecture scheduled");
            }

            setIsDialogOpen(false);
            setNewLectureTitle("");
            setNewLectureDate("");
            setNewLectureFile(null);
            fetchData();

        } catch (e) {
            toast.error("Error creating lecture");
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    const openAttendance = async (lecture: any) => {
        setSelectedLecture(lecture);
        setIsAttendanceOpen(true);
        // Fetch existing attendance
        try {
            const res = await fetch(`/api/lectures/${lecture.id}/attendance`);
            if (res.ok) {
                const data = await res.json();
                const map: Record<string, string> = {};
                data.attendance.forEach((a: any) => {
                    map[a.traineeId] = a.status;
                });
                setAttendanceMap(map);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const markAttendance = async (traineeId: string, status: string) => {
        try {
            const res = await fetch(`/api/lectures/${selectedLecture.id}/attendance`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ traineeId, status }),
            });
            if (res.ok) {
                setAttendanceMap(prev => ({ ...prev, [traineeId]: status }));
                toast.success("Attendance marked");
            } else {
                toast.error("Failed to mark attendance");
            }
        } catch (e) {
            toast.error("Error marking attendance");
        }
    };

    // Material Upload Logic
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingLectureId, setUploadingLectureId] = useState<string | null>(null);

    const onUploadClick = (lectureId: string) => {
        setUploadingLectureId(lectureId);
        setTimeout(() => fileInputRef.current?.click(), 0);
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingLectureId) return;

        const formData = new FormData();
        formData.append("file", file);

        const toastId = toast.loading("Uploading file...");

        try {
            const res = await fetch(`/api/lectures/${uploadingLectureId}/files`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                toast.success("File uploaded", { id: toastId });
                fetchData();
            } else {
                toast.error("Upload failed", { id: toastId });
            }
        } catch (error) {
            toast.error("Error uploading file", { id: toastId });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = "";
            setUploadingLectureId(null);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!confirm("Delete this file?")) return;
        try {
            const res = await fetch(`/api/lecture-files/${fileId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("File deleted");
                fetchData();
            } else {
                toast.error("Failed to delete file");
            }
        } catch (e) {
            toast.error("Error deleting file");
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!course) return <div>Course not found</div>;

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
                        {isTrainer && (
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" /> Add Lecture
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Lecture</DialogTitle>
                                        <DialogDescription>Create a new lecture and optionally upload materials.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="title">Title</Label>
                                            <Input id="title" value={newLectureTitle} onChange={e => setNewLectureTitle(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="date">Date & Time</Label>
                                            <Input id="date" type="datetime-local" value={newLectureDate} onChange={e => setNewLectureDate(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="file">Lecture Material (Optional)</Label>
                                            <Input
                                                id="file"
                                                type="file"
                                                onChange={(e) => setNewLectureFile(e.target.files?.[0] || null)}
                                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleCreateLecture} disabled={creating}>
                                            {creating ? "Creating..." : "Create Lecture"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <div className="grid gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lectures</CardTitle>
                                <CardDescription>Upcoming and past lectures.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {lectures.length === 0 ? (
                                    <p className="text-muted-foreground">No lectures scheduled yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {lectures.map((lecture: any) => (
                                            <div key={lecture.id} className="border-b pb-4 last:border-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-primary/10 p-2 rounded-full">
                                                            <Calendar className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold">{lecture.title}</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(lecture.scheduledAt).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {isTrainer && (
                                                            <>
                                                                <Button variant="outline" size="sm" onClick={() => onUploadClick(lecture.id)}>
                                                                    <Upload className="mr-2 h-4 w-4" />
                                                                    Upload
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => openAttendance(lecture)}>
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    Attendance
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Materials List */}
                                                {lecture.files && lecture.files.length > 0 && (
                                                    <div className="pl-14 space-y-1 mt-2">
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Materials</p>
                                                        {lecture.files.map((file: any) => (
                                                            <div key={file.id} className="flex items-center gap-2 text-sm group">
                                                                <FileIcon className="h-4 w-4 text-blue-500" />
                                                                <a
                                                                    href={`/api/lecture-files/${file.id}/download`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="hover:underline flex-1 truncate"
                                                                >
                                                                    {file.fileName}
                                                                </a>
                                                                {isTrainer && (
                                                                    <button
                                                                        onClick={() => handleDeleteFile(file.id)}
                                                                        className="opacity-0 group-hover:opacity-100 text-destructive text-xs hover:underline"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Dialog open={isAttendanceOpen} onOpenChange={setIsAttendanceOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Mark Attendance: {selectedLecture?.title}</DialogTitle>
                                <DialogDescription>Mark present, absent, or late for each student.</DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4">
                                {trainees.length === 0 ? (
                                    <p className="text-center text-muted-foreground">No students found.</p>
                                ) : (
                                    trainees.map(trainee => (
                                        <div key={trainee.id} className="flex items-center justify-between border p-3 rounded-md">
                                            <div>
                                                <div className="font-medium">{trainee.name}</div>
                                                <div className="text-xs text-muted-foreground">{trainee.email}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={attendanceMap[trainee.id] === 'present' ? 'default' : 'outline'}
                                                    className={attendanceMap[trainee.id] === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                                                    onClick={() => markAttendance(trainee.id, 'present')}
                                                >
                                                    Present
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={attendanceMap[trainee.id] === 'late' ? 'default' : 'outline'}
                                                    className={attendanceMap[trainee.id] === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                                                    onClick={() => markAttendance(trainee.id, 'late')}
                                                >
                                                    Late
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={attendanceMap[trainee.id] === 'absent' ? 'default' : 'outline'}
                                                    className={attendanceMap[trainee.id] === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                                                    onClick={() => markAttendance(trainee.id, 'absent')}
                                                >
                                                    Absent
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                </div>
            </SidebarInset>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={onFileChange}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.png,.jpg,.jpeg"
            />
        </SidebarProvider>
    );
}
