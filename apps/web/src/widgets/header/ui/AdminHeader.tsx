"use client";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { LogOut, Terminal, Settings, Bell } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";

export function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline-block">AI Orchestrator</span>
          </Link>

          {/* Removed Dashboard link */}
        </div>

        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <ThemeToggle />
          <div className="h-4 w-px bg-border hidden sm:block"></div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-medium leading-none">
                {user?.email || "Admin"}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Superuser
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  role="button"
                  className="h-9 w-9 bg-primary/10 text-primary font-bold flex items-center justify-center rounded-full border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                >
                  {user?.email?.[0].toUpperCase() || "A"}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
