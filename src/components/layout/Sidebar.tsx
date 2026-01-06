"use client";

import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Building,
  Book,
  CalendarDays,
  Settings,
  FileText,
  ClipboardList,
  DoorOpen,
  GraduationCap,
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "faculty"],
  },
  {
    name: "Faculty",
    href: "/dashboard/faculty",
    icon: Users,
    roles: ["admin"],
  },
  {
    name: "Departments",
    href: "/dashboard/departments",
    icon: Building,
    roles: ["admin"],
  },
  {
    name: "Courses",
    href: "/dashboard/courses",
    icon: GraduationCap,
    roles: ["admin"],
  },
  {
    name: "Batches",
    href: "/dashboard/batches",
    icon: Users, // Reusing Users icon for batches for now
    roles: ["admin"],
  },
  {
    name: "Subjects",
    href: "/dashboard/subjects",
    icon: Book,
    roles: ["admin"],
  },
  {
    name: "Rooms",
    href: "/dashboard/rooms",
    icon: DoorOpen,
    roles: ["admin"],
  },
  {
    name: "Scheduling Rules",
    href: "/dashboard/rules",
    icon: Settings,
    roles: ["admin"],
  },
  {
    name: "Timetable Generation",
    href: "/dashboard/generate-timetable",
    icon: CalendarDays,
    roles: ["admin"],
  },
  {
    name: "View Timetables",
    href: "/dashboard/view-timetables",
    icon: ClipboardList,
    roles: ["admin", "faculty"],
  },
  {
    name: "Workload Reports",
    href: "/dashboard/workload-reports",
    icon: FileText,
    roles: ["admin", "faculty"],
  },
];

export function Sidebar({ className }: SidebarProps) {
  // In a real app, you'd get the user's role from context/auth
  const userRole = "admin"; // For now, assume admin role to show all links

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Admin Panel
          </h2>
          <div className="space-y-1">
            {navItems.map((item) =>
              item.roles.includes(userRole) ? (
                <Button
                  key={item.name}
                  asChild
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Link to={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                </Button>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}