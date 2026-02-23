"use client";

import { useAuth } from "@/shared/lib/hooks/useAuth";
import { Loader2, Lock, LogIn } from "lucide-react";
import { AdminHeader } from "@/widgets/header/ui/AdminHeader";
import { LandingHeader } from "@/widgets/header/ui/LandingHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <LandingHeader />
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Verifying admin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/20">
        <LandingHeader />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-in fade-in zoom-in duration-300">
          <div className="h-24 w-24 bg-background rounded-3xl flex items-center justify-center mb-8 border shadow-sm">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Admin Access Required
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 text-lg">
            You must be authenticated as an administrator to view the
            orchestrator queues and live agent metrics.
          </p>
          <button
            onClick={() => login({ email: "admin@starter.kit" })}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 h-12 px-8"
          >
            <LogIn className="h-5 w-5" />
            <span>Login as Admin</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminHeader />
      {children}
    </>
  );
}
