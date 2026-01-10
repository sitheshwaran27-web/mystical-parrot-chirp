"use client";

import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building,
  Book,
  CalendarDays,
  FileText,
  ClipboardList,
  Boxes,
  ListChecks,
  Heart
} from "lucide-react";
import { useSession } from "@/context/SessionContext";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const navItems = [
  {
    name: "Faculty",
    href: "/dashboard/faculty",
    icon: Users,
    roles: ["admin", "faculty"],
  },
  {
    name: "My Preferences",
    href: "/dashboard/preferences",
    icon: Heart,
    roles: ["faculty", "admin"],
  },
  {
    name: "Departments",
    href: "/dashboard/departments",
    icon: Building,
    roles: ["admin"],
  },
  {
    name: "Batches",
    href: "/dashboard/batches",
    icon: Boxes, 
    roles: ["admin"],
  },
  {
    name: "Subjects",
    href: "/dashboard/subjects",
    icon: Book,
    roles: ["admin"],
  },
  {
    name: "Scheduling Rules",
    href: "/dashboard/rules",
    icon: ListChecks,
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
  const { profile, signOut } = useSession();
  const userRole = profile?.role || "student";

  return (
    <div className={cn("pb-12 h-full flex flex-col", className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Navigation
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
      <div className="px-3 py-2 border-t mt-auto">
        <Button variant="outline" className="w-full justify-start" onClick={signOut}>
           Sign Out
        </Button>
      </div>
    </div>
  );
}