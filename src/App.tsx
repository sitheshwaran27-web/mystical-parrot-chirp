import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FacultyManagement from "./pages/FacultyManagement";
import LoginPage from "./pages/LoginPage"; // Import the new LoginPage
import StudentDashboard from "./pages/StudentDashboard"; // Import the new StudentDashboard

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} /> {/* Redirect to login */}
          <Route path="/login" element={<LoginPage />} /> {/* Login Page */}
          <Route path="/dashboard" element={<Index />} />
          <Route path="/dashboard/faculty" element={<FacultyManagement />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} /> {/* Student Dashboard */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;