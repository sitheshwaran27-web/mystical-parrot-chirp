"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, CalendarDays, User } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/context/SessionContext";

interface StudentDashboardLayoutProps {
  children: React.ReactNode;
}

export const StudentDashboardLayout: React.FC<StudentDashboardLayoutProps> = ({
  children,
}) => {
  const { user, profile, signOut } = useSession();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <Link to="/student-dashboard" className="text-2xl font-bold text-primary">
          Timetable App
        </Link>
        <nav className="flex items-center space-x-4">
          <Button asChild variant="ghost">
            <Link to="/student-dashboard">
              <CalendarDays className="mr-2 h-4 w-4" />
              My Timetable
            </Link>
          </Button>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>{user?.email || "Student"}</span>
            {profile?.class_name && (
              <span className="text-sm text-muted-foreground">({profile.class_name})</span>
            )}
          </div>
          <Button variant="ghost" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </nav>
      </header>
      <main className="flex-1 p-8 overflow-auto">
        {children}
        <MadeWithDyad />
      </main>
    </div>
  );
};