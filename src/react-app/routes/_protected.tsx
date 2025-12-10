import { getSession } from "@/lib/auth-client";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const { data } = await getSession();
    if (!data?.session) {
      redirect({ to: "/login", throw: true });
    }

    // Check approval status
    // Note: getSession might not return custom fields depending on config, 
    // so we might need to fetch /api/me or assume custom fields are passed.
    // For now, let's try assuming it's in the user object or fetch it.
    // To be safe and quick, we can fetch /api/me if we want to be sure, or just cast.

    // Actually, checking session data directly first.
    // If not approved and NOT on pending page, redirect to pending.
    // If approved and ON pending page, redirect to dashboard.

    const user = data?.user as any;
    // const isApproved = user?.approved;
    // const isPendingPage = location.pathname === "/pending-approval";

    // We no longer redirect to /pending-approval. 
    // Instead we let them through to dashboard and handle restricted view there.

    // if (!isApproved && !isPendingPage) {
    //   redirect({ to: "/pending-approval" as any, throw: true });
    // }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
