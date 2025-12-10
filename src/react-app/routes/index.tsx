import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
    BookOpen,
    GraduationCap,
    Users,
    Video,
    ArrowRight,
    Star,
    Trophy,
} from "lucide-react";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
    beforeLoad: async () => {
        const { data } = await getSession();
        if (data?.session) {
            redirect({ to: "/dashboard", throw: true });
        }
    },
    component: LandingPage,
});

function LandingPage() {
    return (
        <div className="min-h-screen bg-background">
            <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                            <GraduationCap className="size-4" />
                        </div>
                        <span className="text-xl font-bold">LMS Platform</span>
                    </div>
                    <div className="hidden items-center gap-8 md:flex">
                        <a
                            href="#courses"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Courses
                        </a>
                        <a
                            href="#features"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Features
                        </a>
                        <a
                            href="#testimonials"
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Testimonials
                        </a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" asChild>
                            <Link to="/login">Sign In</Link>
                        </Button>
                        <Button asChild>
                            <Link to="/sign-up">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </nav>

            <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-chart-2/10 blur-3xl" />
                </div>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-muted-foreground">
                                Trusted by 10,000+ Students
                            </span>
                        </div>
                        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                            Empower your{" "}
                            <span className="bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
                                Learning Journey
                            </span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                            Master new skills with our interactive courses, expert instructors, and
                            comprehensive learning paths. Join the future of education today.
                        </p>
                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Button size="lg" className="h-12 px-8 text-base" asChild>
                                <Link to="/sign-up">
                                    Start Learning
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-20 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
                        <div className="rounded-2xl border bg-card p-2 shadow-2xl">
                            <div className="rounded-xl bg-muted/50 p-8">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="rounded-lg bg-background p-4 shadow-sm">
                                        <div className="mb-4 flex items-center justify-between">
                                            <span className="text-sm font-medium">Web Development</span>
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                                12 Modules
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            <CourseCard
                                                title="React Fundamentals"
                                                tag="Frontend"
                                                color="bg-chart-1"
                                            />
                                            <CourseCard
                                                title="Advanced TypeScript"
                                                tag="Frontend"
                                                color="bg-chart-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-background p-4 shadow-sm">
                                        <div className="mb-4 flex items-center justify-between">
                                            <span className="text-sm font-medium">Data Science</span>
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                                8 Modules
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            <CourseCard
                                                title="Python for Analysis"
                                                tag="Data"
                                                color="bg-chart-3"
                                            />
                                            <CourseCard
                                                title="Machine Learning 101"
                                                tag="AI"
                                                color="bg-chart-4"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-background p-4 shadow-sm">
                                        <div className="mb-4 flex items-center justify-between">
                                            <span className="text-sm font-medium">Design</span>
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                                6 Modules
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            <CourseCard
                                                title="UI/UX Principles"
                                                tag="Design"
                                                color="bg-chart-5"
                                                completed
                                            />
                                            <CourseCard
                                                title="Figma Mastery"
                                                tag="Tools"
                                                color="bg-chart-1"
                                                completed
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="py-20 sm:py-32">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            Features designed for success
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                            Everything you need to learn, practice, and master your skills.
                        </p>
                    </div>
                    <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        <FeatureCard
                            icon={<BookOpen className="h-6 w-6" />}
                            title="Comprehensive Curriculum"
                            description="Structured learning paths covering in-demand skills."
                        />
                        <FeatureCard
                            icon={<Video className="h-6 w-6" />}
                            title="Interactive Lessons"
                            description="Learn by doing with interactive exercises and projects."
                        />
                        <FeatureCard
                            icon={<Users className="h-6 w-6" />}
                            title="Community Support"
                            description="Connect with peers and mentors in our learning community."
                        />
                        <FeatureCard
                            icon={<Trophy className="h-6 w-6" />}
                            title="Certification"
                            description="Earn certificates to showcase your achievements."
                        />
                    </div>
                </div>
            </section>

            <footer className="border-t py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                                <GraduationCap className="size-4" />
                            </div>
                            <span className="text-lg font-bold">LMS Platform</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2025 LMS Platform. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="group rounded-2xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {icon}
            </div>
            <h3 className="mb-2 text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

function CourseCard({
    title,
    tag,
    color,
    completed,
}: {
    title: string;
    tag: string;
    color: string;
    completed?: boolean;
}) {
    return (
        <div
            className={`rounded-lg border bg-card p-3 ${completed ? "opacity-60" : ""}`}
        >
            <div className="flex items-start justify-between gap-2">
                <span
                    className={`text-sm font-medium ${completed ? "line-through" : ""}`}
                >
                    {title}
                </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                <span className="text-xs text-muted-foreground">{tag}</span>
            </div>
        </div>
    );
}
