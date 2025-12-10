import { getSession } from "@/lib/auth-client";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async () => {
    const { data } = await getSession();
    if (!data?.session) {
      redirect({ to: "/login", throw: true });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
