"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Database,
  Sliders,
  Calendar,
  RefreshCw,
  BarChart,
  Download,
  CalendarDays,
  UserCheck,
  FileText,
  Clock,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}


const navItems = [
  // Admin Items
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    name: "Manage Data",
    href: "/dashboard/manage-data", // Placeholder, map to existing if needed or new
    icon: Database,
    roles: ["admin"],
  },
  {
    name: "Set Priorities",
    href: "/dashboard/priorities", // Placeholder
    icon: Sliders,
    roles: ["admin"],
  },
  {
    name: "Generate Timetable",
    href: "/dashboard/generate-timetable",
    icon: Calendar,
    roles: ["admin"],
  },
  {
    name: "Exam Management",
    href: "/dashboard/exams",
    icon: GraduationCap,
    roles: ["admin"],
  },
  {
    name: "Absence Manager",
    href: "/dashboard/absence",
    icon: CalendarDays,
    roles: ["admin"],
  },
  {
    name: "Partial Regeneration",
    href: "/dashboard/partial-regeneration", // Placeholder
    icon: RefreshCw,
    roles: ["admin"],
  },
  {
    name: "Reports & Analytics",
    href: "/dashboard/workload-reports",
    icon: BarChart,
    roles: ["admin"],
  },
  {
    name: "Export",
    href: "/dashboard/export", // Placeholder
    icon: Download,
    roles: ["admin"],
  },

  // Faculty Items
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["faculty"],
  },
  {
    name: "My Timetable",
    href: "/dashboard/view-timetables",
    icon: CalendarDays,
    roles: ["faculty"],
  },
  {
    name: "Availability",
    href: "/dashboard/preferences",
    icon: Clock, // using Clock as a proxy for Availability/Time
    roles: ["faculty"],
  },
  {
    name: "Workload Summary",
    href: "/dashboard/workload-reports",
    icon: ClipboardList,
    roles: ["faculty"],
  },
  {
    name: "Leave Request",
    href: "/dashboard", // Keep on dashboard main view for now as widget is small
    icon: UserCheck,
    roles: ["faculty"],
  },

  // Student Items
  {
    name: "Dashboard",
    href: "/dashboard", // Student dashboard is at /dashboard for student role
    icon: LayoutDashboard,
    roles: ["student"],
  },
  {
    name: "Class Timetable",
    href: "/dashboard", // Keep on dashboard main view
    icon: FileText,
    roles: ["student"],
  },
  // Retaining some existing items if they map to the new ones, or for safety
  // The plan implies replacing the structure. I am strictly following the new list.
  // Any existing routes not covered here might be inaccessible via sidebar, which is intended for the redesign.
];

export function Sidebar({ className }: SidebarProps) {
  const { profile, signOut } = useSession();
  const userRole = profile?.role || "student";
  const location = useLocation();

  const getRoleColors = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          active: "bg-blue-50 text-blue-700 border-r-2 border-blue-700",
          hover: "hover:text-blue-700 hover:bg-blue-50",
          iconActive: "text-blue-700",
          accent: "blue"
        };
      case 'faculty':
        return {
          active: "bg-purple-50 text-purple-700 border-r-2 border-purple-700",
          hover: "hover:text-purple-700 hover:bg-purple-50",
          iconActive: "text-purple-700",
          accent: "purple"
        };
      case 'student':
        return {
          active: "bg-green-50 text-green-700 border-r-2 border-green-700",
          hover: "hover:text-green-700 hover:bg-green-50",
          iconActive: "text-green-700",
          accent: "green"
        };
      default:
        return {
          active: "bg-blue-50 text-blue-700 border-r-2 border-blue-700",
          hover: "hover:text-blue-700 hover:bg-blue-50",
          iconActive: "text-blue-700",
          accent: "blue"
        };
    }
  };

  const colors = getRoleColors(userRole);

  return (
    <div className={cn("pb-12 h-full flex flex-col pl-2", className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <h2 className="mb-4 px-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Menu
          </h2>
          <div className="space-y-1">
            {navItems.map((item) =>
              item.roles.includes(userRole) ? (
                <Button
                  key={item.name}
                  asChild
                  variant="ghost"
                  className={cn(
                    "w-full justify-start transition-all duration-200",
                    location.pathname === item.href
                      ? `${colors.active} font-medium shadow-sm`
                      : `text-gray-600 ${colors.hover}`
                  )}
                >
                  <Link to={item.href}>
                    <item.icon className={cn("mr-3 h-4 w-4", location.pathname === item.href ? colors.iconActive : "text-gray-400 group-hover:text-indigo-500")} />
                    {item.name}
                  </Link>
                </Button>
              ) : null,
            )}
          </div>
        </div>
      </div>
      <div className="px-3 py-2 border-t border-gray-100 mt-auto">
        <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}