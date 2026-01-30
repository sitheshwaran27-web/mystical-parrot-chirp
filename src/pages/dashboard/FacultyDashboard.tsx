
import React from "react";
import { StatCard } from "@/components/dashboard/widgets/StatCard";
import { FacultyTimetableWidget } from "@/components/dashboard/widgets/FacultyTimetableWidget";
import { InvigilationWidget } from "@/components/dashboard/widgets/InvigilationWidget";
import { LeaveLetterWidget } from "@/components/dashboard/widgets/LeaveLetterWidget";
import { BookOpen, Clock, FileText } from "lucide-react";
import { useFacultyTimetable } from "@/hooks/useFacultyTimetable";

export default function FacultyDashboard() {
    const { timetable, loading } = useFacultyTimetable();

    // Calculate stats
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // Filter out breaks and count classes
    const todayClassesCount = timetable.filter(
        slot => slot.day === today && slot.type !== 'break'
    ).length;

    const weeklyClassesCount = timetable.filter(
        slot => slot.type !== 'break'
    ).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Today's Classes"
                    value={loading ? "-" : todayClassesCount}
                    icon={<BookOpen className="w-6 h-6" />}
                    color="purple"
                />
                <StatCard
                    title="Weekly Classes"
                    value={loading ? "-" : weeklyClassesCount}
                    icon={<Clock className="w-6 h-6" />}
                    color="purple"
                />
                <StatCard
                    title="Leave Requests"
                    value={1}
                    icon={<FileText className="w-6 h-6" />}
                    color="orange"
                    trend="Pending"
                    trendUp={false}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <InvigilationWidget />
                    <FacultyTimetableWidget />
                </div>
                <div className="lg:col-span-1">
                    <LeaveLetterWidget />
                </div>
            </div>
        </div>
    );
}
