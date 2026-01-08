import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound";
import FacultyManagement from "./pages/FacultyManagement";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import SubjectManagement from "./pages/SubjectManagement";
import RoomManagement from "./pages/RoomManagement";
import DepartmentManagement from "./pages/DepartmentManagement";
import BatchManagement from "./pages/BatchManagement";
import SchedulingRuleManagement from "./pages/SchedulingRuleManagement";
import TimetableGeneration from "./pages/TimetableGeneration";
import ViewTimetables from "./pages/ViewTimetables";
import { SessionContextProvider, useSession } from "./context/SessionContext";
import React from "react";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { session, profile, loading } = useSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading session...</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile || !allowedRoles.includes(profile.role || '')) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route
              path="/dashboard/faculty"
              element={
                <ProtectedRoute allowedRoles={["admin", "faculty"]}>
                  <FacultyManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/departments"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DepartmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/batches"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <BatchManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/subjects"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <SubjectManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/rooms"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <RoomManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/rules"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <SchedulingRuleManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/generate-timetable"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <TimetableGeneration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/view-timetables"
              element={
                <ProtectedRoute allowedRoles={["admin", "faculty"]}>
                  <ViewTimetables />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;