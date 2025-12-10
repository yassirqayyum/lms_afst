import { signOut } from "@/lib/auth-client";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/logout")({
  beforeLoad: () => {
    signOut();
    redirect({ to: "/", throw: true, replace: true });
  },
});
