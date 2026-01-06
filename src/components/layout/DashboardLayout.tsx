"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { MadeWithDyad } from "@/components/made-with-dyad";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
}) => {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 border-r bg-sidebar text-sidebar-foreground p-4">
        <h1 className="text-2xl font-bold mb-6 text-sidebar-primary">
          Timetable App
        </h1>
        <Sidebar />
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {children}
        <MadeWithDyad />
      </main>
    </div>
  );
};