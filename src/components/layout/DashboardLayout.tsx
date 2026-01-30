
import React from "react";
import { Sidebar } from "./Sidebar";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bell, User, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MadeWithDyad } from "@/components/made-with-dyad";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useSession();
  const userRole = profile?.role || "student";

  const getRoleTheme = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          bg: "bg-[#2563EB]", // Blue
          border: "border-[#2563EB]/30",
          lightBg: "bg-[#2563EB]",
          accent: "blue"
        };
      case 'faculty':
        return {
          bg: "bg-[#7C3AED]", // Purple
          border: "border-[#7C3AED]/30",
          lightBg: "bg-[#7C3AED]",
          accent: "purple"
        };
      case 'student':
        return {
          bg: "bg-[#16A34A]", // Green
          border: "border-[#16A34A]/20",
          lightBg: "bg-[#16A34A]",
          accent: "green"
        };
      default:
        return {
          bg: "bg-[#2563EB]",
          border: "border-[#2563EB]/30",
          lightBg: "bg-[#2563EB]",
          accent: "blue"
        };
    }
  };

  const theme = getRoleTheme(userRole);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-white border-r border-gray-100 shadow-sm">
        <div className={`flex h-16 items-center px-6 border-b border-gray-50 ${theme.bg}`}>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              {userRole === 'admin' ? 'A' : userRole === 'faculty' ? 'F' : 'S'}
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Time Table Generator</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <Sidebar className="px-2" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className={`h-16 ${theme.bg} border-b ${theme.border} flex items-center justify-between px-4 md:px-8 shadow-sm`}>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <div className={`flex h-16 items-center px-6 border-b border-gray-50 ${theme.bg}`}>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                      {userRole === 'admin' ? 'A' : userRole === 'faculty' ? 'F' : 'S'}
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">Time Table Generator</span>
                  </Link>
                </div>
                <div className="flex-1 overflow-y-auto py-4">
                  <Sidebar className="px-2" />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            <div className={`flex items-center gap-3 pl-4 border-l ${theme.border}`}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{profile?.first_name}</p>
                <p className="text-xs text-white/70 capitalize">{profile?.role}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-sm">
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          {children}
        </div>
        <div className="mt-auto">
          <MadeWithDyad />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;