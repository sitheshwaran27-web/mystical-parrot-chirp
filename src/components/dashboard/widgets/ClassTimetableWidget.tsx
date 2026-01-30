import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTimetableSlots } from "@/hooks/useTimetableSlots";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Download, CheckCircle2 } from "lucide-react";
import { showError } from "@/utils/toast";
import { useStudentTimetable } from "@/hooks/useStudentTimetable";

export function ClassTimetableWidget() {
    const { slots, loading: slotsLoading } = useTimetableSlots();
    const { timetable, loading: timetableLoading } = useStudentTimetable();

    const loading = slotsLoading || timetableLoading;

    if (loading) {
        return (
            <Card className="border-0 shadow-lg shadow-emerald-900/5 bg-white p-20 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </Card>
        );
    }

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Map dynamic slots to the real data from timetable
    const displayData = slots.map((slotTime) => {
        const rowData: any = { time: slotTime };

        days.forEach(day => {
            const dayKey = day.toLowerCase().substring(0, 3);
            const slot = timetable.find(s =>
                s.day.trim().toLowerCase() === day.trim().toLowerCase() &&
                s.time_slot.trim() === slotTime.trim()
            );

            if (slot) {
                if (slot.type === 'break') {
                    rowData[dayKey] = "Break";
                } else {
                    rowData[dayKey] = slot.subjects?.name || "No Subject";
                }
            } else {
                rowData[dayKey] = "Free";
            }
        });

        return rowData;
    });

    return (
        <div className="space-y-6">
            <Tabs defaultValue="weekly" className="w-full">
                <Card className="border-0 shadow-lg shadow-emerald-900/5 bg-white overflow-hidden">
                    <CardHeader className="pb-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 p-8">
                        <div>
                            <CardTitle className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <FileText className="w-6 h-6" />
                                </div>
                                Class Timetable
                            </CardTitle>
                            <CardDescription className="text-base font-medium text-gray-400 mt-1">
                                Your official weekly academic schedule
                            </CardDescription>
                        </div>
                        <TabsList className="bg-emerald-50/50 p-1 h-12 rounded-xl grid grid-cols-2 w-[240px]">
                            <TabsTrigger value="weekly" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-sm transition-all">Weekly View</TabsTrigger>
                            <TabsTrigger value="daily" className="rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-sm transition-all">Day View</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <TabsContent value="weekly" className="m-0">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="p-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Time</th>
                                        <th className="p-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Monday</th>
                                        <th className="p-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Tuesday</th>
                                        <th className="p-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Wednesday</th>
                                        <th className="p-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Thursday</th>
                                        <th className="p-6 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Friday</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {displayData.map((row, index) => (
                                        <tr key={index} className="hover:bg-emerald-50/20 transition-colors">
                                            <td className="p-6 font-bold text-sm text-gray-500 whitespace-nowrap">{row.time}</td>
                                            {[row.mon, row.tue, row.wed, row.thu, row.fri].map((cell, idx) => {
                                                const isBreak = cell === 'Break';
                                                const isLab = cell === 'Lab';
                                                const isFree = cell === 'Free';

                                                return (
                                                    <td key={idx} className="p-2">
                                                        <div className={`p-4 rounded-xl font-bold text-sm text-center min-h-[60px] flex items-center justify-center transition-all ${isBreak ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-200 shadow-sm' :
                                                            isLab ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-200 shadow-sm' :
                                                                isFree ? 'border-2 border-dashed border-gray-100 text-gray-300' :
                                                                    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 shadow-sm'
                                                            }`}>
                                                            {isBreak ? 'BREAK' : cell}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </TabsContent>
                        <TabsContent value="daily" className="m-0 p-6">
                            {(() => {
                                const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                                const todayShort = today.toLowerCase().substring(0, 3);
                                const todayClasses = displayData.map(row => ({
                                    time: row.time,
                                    subject: row[todayShort] || 'Free'
                                }));

                                return (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{today}'s Schedule</h3>
                                                <p className="text-sm text-gray-400">Your classes for today</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {todayClasses.map((item, index) => {
                                                const isBreak = item.subject === 'Break';
                                                const isFree = item.subject === 'Free';

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isBreak ? 'bg-orange-50 border border-orange-100' :
                                                            isFree ? 'bg-gray-50 border border-gray-100' :
                                                                'bg-emerald-50 border border-emerald-100'
                                                            }`}
                                                    >
                                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm ${isBreak ? 'bg-orange-100 text-orange-600' :
                                                            isFree ? 'bg-gray-100 text-gray-400' :
                                                                'bg-emerald-100 text-emerald-600'
                                                            }`}>
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={`font-bold ${isBreak ? 'text-orange-700' :
                                                                isFree ? 'text-gray-400' :
                                                                    'text-gray-900'
                                                                }`}>
                                                                {isBreak ? 'BREAK' : item.subject}
                                                            </p>
                                                            <p className="text-sm text-gray-400">{item.time}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>

            {/* Download Section */}
            <Card className="border-0 shadow-lg shadow-emerald-900/5 bg-white overflow-hidden p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Download Timetable</h3>
                            <p className="text-gray-500 font-medium text-sm">Get a printable version of your schedule.</p>
                        </div>
                    </div>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 rounded-2xl font-black text-lg gap-2 shadow-xl shadow-emerald-600/20 transform transition-transform hover:scale-105 active:scale-95">
                        <Download className="h-5 w-5" />
                        Download PDF
                    </Button>
                </div>
            </Card>
        </div>
    );
}
