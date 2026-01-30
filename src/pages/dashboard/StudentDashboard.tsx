
import React from "react";
import { StatCard } from "@/components/dashboard/widgets/StatCard";
import { ClassTimetableWidget } from "@/components/dashboard/widgets/ClassTimetableWidget";
import { Calendar, FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <StatCard title="Today's Schedule" value="4 Classes" icon={<Calendar className="w-6 h-6" />} color="green" className="col-span-2" />
                </div>
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Upcoming Lab</p>
                            <h3 className="text-xl font-bold text-gray-900 mt-1">Chemistry Lab</h3>
                            <p className="text-xs text-gray-400 mt-2">Starts in 30 mins</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl">
                            <FlaskConical className="w-8 h-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ClassTimetableWidget />
                </div>
                <div className="lg:col-span-1">
                    {/* Download Timetable placeholder */}
                    <Card className="h-full border-0 shadow-sm">
                        <CardContent className="p-6 flex flex-col justify-center h-full space-y-4">
                            <h3 className="font-bold text-gray-800">Download Timetable</h3>
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                Download PDF
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
