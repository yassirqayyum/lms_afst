import { ForgetPasswordForm } from "@/components/forget-password-form";
import { AuthLayout } from "@/layouts/auth-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/forget-password")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthLayout>
      <ForgetPasswordForm />
    </AuthLayout>
  );
}
