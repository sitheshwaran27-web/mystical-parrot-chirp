"use client";

import React from "react";
import { StudentDashboardLayout } from "@/components/layout/StudentDashboardLayout";
import TimetableDisplay from "@/components/TimetableDisplay";
import { useSession } from "@/context/SessionContext";
import { Loader2 } from "lucide-react";

const StudentDashboard = () => {
  const { profile, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading user session...</span>
      </div>
    );
  }

  return (
    <StudentDashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">
          Welcome, {profile?.first_name || "Student"}!
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Here is your personalized timetable for class:{" "}
          <span className="font-semibold text-primary">{profile?.class_name || "N/A"}</span>.
        </p>
        <TimetableDisplay />
      </div>
    </StudentDashboardLayout>
  );
};

export default StudentDashboard;