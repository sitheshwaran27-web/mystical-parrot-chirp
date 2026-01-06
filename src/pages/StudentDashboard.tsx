"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";

const StudentDashboard = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome, Student!</h1>
      <p className="text-lg text-muted-foreground mb-8">
        This is your personalized student dashboard.
      </p>
      <div className="mt-auto">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default StudentDashboard;