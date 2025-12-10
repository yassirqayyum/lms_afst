import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

export const Route = createFileRoute("/_protected/pending-approval")({
    component: PendingApproval,
});

function PendingApproval() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Account Pending Approval</h1>
                <p className="text-muted-foreground max-w-[500px]">
                    Your account is currently waiting for administrator approval.
                    You will be able to access the dashboard once your account has been verified.
                </p>
            </div>
            <div className="flex gap-4">
                <Button variant="outline" onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
