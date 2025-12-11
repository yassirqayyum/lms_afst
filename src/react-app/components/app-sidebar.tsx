import { IconDashboard, IconHelp, IconUsers, IconBook } from "@tabler/icons-react";
import { GraduationCap } from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { User } from "@/lib/types";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data } = useSession();
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        setCurrentUser(data.user as User);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    }
    if (data?.user?.id) {
      fetchUser();
    }
  }, [data?.user?.id]);

  const user = {
    name: data?.user.name || "User",
    email: data?.user.email || "",
    avatar: data?.user.image || "/avatars/default.jpg",
  };

  const role = currentUser?.role;

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
  ];

  if (role === "admin") {
    navMain.push(
      { title: "Manage Trainers", url: "/users?role=trainer", icon: IconUsers },
      { title: "Manage Students", url: "/users?role=trainee", icon: IconUsers },
      { title: "Manage Courses", url: "/courses", icon: IconBook },
      { title: "Course Enrollments", url: "/enrollments", icon: IconBook }
    );
  } else if (role === "trainer") {
    navMain.push(
      { title: "My Courses", url: "/courses", icon: IconBook }
    );
  } else if (role === "trainee") {
    navMain.push(
      { title: "My Courses", url: "/my-courses", icon: IconBook }
    );
  }

  const sidebarData = {
    user,
    navMain: navMain, // Changed to navMain
    navSecondary: [
      {
        title: "Get Help",
        url: "#",
        icon: IconHelp,
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}> {/* Changed collapsible prop */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <a href="/" className="flex items-center gap-2 p-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GraduationCap className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">LMS Platform</span>
                <span className="truncate text-xs">Learning Management</span>
              </div>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        <NavSecondary items={sidebarData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
