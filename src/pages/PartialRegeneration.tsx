import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PartialRegenerationWidget } from "@/components/dashboard/widgets/PartialRegenerationWidget";

const PartialRegeneration = () => {
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
                            <h1 className="text-3xl font-bold text-[#2d3748] tracking-tight text-center">Partial Timetable Regeneration</h1>
                        </div>
                        <p className="text-slate-500 text-lg font-medium text-center">
                            Regenerate specific slots or days without affecting the entire schedule.
                        </p>
                    </div>
                </div>

                {/* Main Content Container */}
                <Card className="bg-white rounded-[2rem] border-none shadow-xl shadow-blue-900/5 p-8 md:p-12">
                    <div className="max-w-3xl mx-auto">
                        <PartialRegenerationWidget />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PartialRegeneration;
