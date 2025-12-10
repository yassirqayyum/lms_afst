import { getSession } from "@/lib/auth-client";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async () => {
    const { data } = await getSession();
    if (data?.session) {
      redirect({ to: "/dashboard", throw: true });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
