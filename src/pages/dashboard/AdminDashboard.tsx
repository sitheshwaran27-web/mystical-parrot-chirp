
import React from "react";
import { StatCard } from "@/components/dashboard/widgets/StatCard";
import { TimetableGenerationWidget } from "@/components/dashboard/widgets/TimetableGenerationWidget";
import { PartialRegenerationWidget } from "@/components/dashboard/widgets/PartialRegenerationWidget";
import { WorkloadReportChart } from "@/components/dashboard/widgets/WorkloadReportChart";
import { Users, GraduationCap, Building, LayoutTemplate } from "lucide-react";

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Classes" value={18} icon={<LayoutTemplate className="w-6 h-6" />} color="blue" />
                <StatCard title="Total Faculty" value={25} icon={<Users className="w-6 h-6" />} color="blue" />
                <StatCard title="Classrooms" value={12} icon={<Building className="w-6 h-6" />} color="blue" />
                <StatCard title="Free Slots" value={5} icon={<LayoutTemplate className="w-6 h-6" />} color="orange" trend="Low Availability" trendUp={false} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto">
                <div className="space-y-6 lg:col-span-1">
                    <div className="h-[200px]">
                        <TimetableGenerationWidget />
                    </div>
                    <div className="h-auto">
                        <PartialRegenerationWidget />
                    </div>
                </div>
                <div className="lg:col-span-2">
                    <div className="h-auto lg:h-[500px]"> {/* Increased height for chart */}
                        <WorkloadReportChart />
                    </div>
                    {/* Add Export widget or button row here if needed */}
                    <div className="mt-6 flex justify-end gap-3">
                        {/* Placeholder for export buttons shown in mockup */}
                    </div>
                </div>
            </div>
        </div>
    );
}
