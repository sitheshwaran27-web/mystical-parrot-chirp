import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users, GraduationCap, Building2, BookOpen, Layers, Settings, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const ManageData = () => {
    const managementOptions = [
        {
            title: "Faculty",
            description: "Manage faculty profiles and workloads",
            icon: Users,
            href: "/dashboard/faculty",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Students",
            description: "Manage student enrollments and batches",
            icon: GraduationCap,
            href: "/dashboard/students",
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
        },
        {
            title: "Departments",
            description: "Configure departments and courses",
            icon: Building2,
            href: "/dashboard/departments",
            color: "text-violet-600",
            bgColor: "bg-violet-50",
        },
        {
            title: "Subjects",
            description: "Manage subjects and curriculum",
            icon: BookOpen,
            href: "/dashboard/subjects",
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
        {
            title: "Batches",
            description: "Manage student batches and sections",
            icon: Layers,
            href: "/dashboard/batches",
            color: "text-cyan-600",
            bgColor: "bg-cyan-50",
        },
        {
            title: "College Timing",
            description: "Set working hours, days and break timings",
            icon: Clock,
            href: "/dashboard/rules",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            title: "Scheduling Rules",
            description: "Define constraints and preferences",
            icon: Settings,
            href: "/dashboard/priorities",
            color: "text-slate-600",
            bgColor: "bg-slate-100",
        },
    ];

    return (
        <div className="min-h-screen bg-[#edf2f9] -m-8 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative flex flex-col items-center pt-2 pb-4">
                    <div className="absolute left-0 top-0 pt-2">
                        <Link to="/dashboard">
                            <Button variant="ghost" className="text-slate-500 hover:text-slate-700 text-lg font-medium gap-2 pl-0 hover:bg-transparent transition-colors">
                                <ArrowLeft className="h-5 w-5" /> Back
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="border-[1.5px] border-blue-400/40 bg-white px-10 py-3 rounded-xl shadow-sm">
                            <h1 className="text-3xl font-bold text-[#2d3748] tracking-tight">Manage Data</h1>
                        </div>
                        <p className="text-slate-500 text-lg font-medium">
                            Select a category to manage records and configurations.
                        </p>
                    </div>
                </div>

                {/* Main Content Container */}
                <Card className="bg-white rounded-[2rem] border-none shadow-xl shadow-blue-900/5 p-8 md:p-12">
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {managementOptions.map((option) => (
                            <Link key={option.title} to={option.href} className="block group">
                                <Card className="h-full transition-all duration-300 hover:scale-[1.02] border border-slate-100 hover:border-blue-100 cursor-pointer bg-white shadow-sm hover:shadow-md">
                                    <CardContent className="p-7 flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-4 rounded-2xl ${option.bgColor} ${option.color} shrink-0 transition-transform group-hover:scale-110`}>
                                                <option.icon className="h-7 w-7" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-xl text-[#2d3748] group-hover:text-blue-600 transition-colors">
                                                    {option.title}
                                                </h3>
                                                <p className="text-sm text-slate-400 leading-snug font-medium">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-slate-300 group-hover:text-blue-400 transition-colors pl-2">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ManageData;
