import { SignUpForm } from "@/components/sign-up-form";
import { AuthLayout } from "@/layouts/auth-layout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/sign-up")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}
