import React from "react";
import { useSession } from "@/hooks/use-session";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import FacultyDashboard from "@/pages/dashboard/FacultyDashboard";
import StudentDashboard from "@/pages/dashboard/StudentDashboard";

const DashboardHome = () => {
    const { profile } = useSession();
    const userRole = profile?.role || "student";

    const renderDashboard = () => {
        switch (userRole) {
            case "admin":
                return <AdminDashboard />;
            case "faculty":
                return <FacultyDashboard />;
            case "student":
                return <StudentDashboard />;
            default:
                return <StudentDashboard />; // Default to student or unauthorized view
        }
    };

    return (
        <DashboardLayout>
            {renderDashboard()}
        </DashboardLayout>
    );
};

export default DashboardHome;

