import { IconDashboard, IconHelp } from "@tabler/icons-react";
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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data } = useSession();

  const user = {
    name: data?.user.name || "User",
    email: data?.user.email || "",
    avatar: data?.user.image || "/avatars/default.jpg",
  };

  const sidebarData = {
    user,
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      },
    ],
    navSecondary: [
      {
        title: "Get Help",
        url: "#",
        icon: IconHelp,
      },
    ],
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                    <GraduationCap className="size-4" />
                  </div>
                  <span className="text-base font-semibold">
                    LMS Platform
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
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
