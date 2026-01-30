"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, CalendarDays, User } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/hooks/use-session";

interface StudentDashboardLayoutProps {
  children: React.ReactNode;
}

export const StudentDashboardLayout: React.FC<StudentDashboardLayoutProps> = ({
  children,
}) => {
  const { user, profile, signOut } = useSession();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between p-4 border-b bg-white border-green-100 shadow-sm">
        <Link to="/student-dashboard" className="text-2xl font-bold text-green-700 flex items-center gap-2">
          {/* Logo or Icon could go here */}
          Timetable App
        </Link>
        <nav className="flex items-center space-x-4">
          <Button asChild variant="ghost" className="text-gray-600 hover:text-green-700 hover:bg-green-50">
            <Link to="/student-dashboard">
              <CalendarDays className="mr-2 h-4 w-4" />
              My Timetable
            </Link>
          </Button>
          <div className="flex items-center space-x-2 text-sm">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{user?.email || "Student"}</span>
              {profile?.class_name && (
                <span className="text-xs text-gray-500">{profile.class_name}</span>
              )}
            </div>
          </div>
          <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={signOut}>
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