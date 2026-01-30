
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Calendar, FileText } from "lucide-react";
import { useFacultyTimetable } from "@/hooks/useFacultyTimetable";
import { useTimetableSlots } from "@/hooks/useTimetableSlots";

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function FacultyTimetableWidget() {
    const { timetable, loading, error } = useFacultyTimetable();
    const { slots: TIME_SLOTS_ORDER, loading: slotsLoading } = useTimetableSlots();

    if (loading || slotsLoading) {
        return (
            <Card className="h-full border-0 shadow-lg shadow-indigo-900/5 bg-white col-span-1 lg:col-span-2">
                <CardHeader className="pb-3 border-b border-gray-50">
                    <CardTitle className="text-lg font-bold text-gray-800">My Timetable</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="h-full border-0 shadow-lg shadow-indigo-900/5 bg-white col-span-1 lg:col-span-2">
                <CardHeader className="pb-3 border-b border-gray-50">
                    <CardTitle className="text-lg font-bold text-gray-800">My Timetable</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-center text-red-500 py-8">
                        <p>{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (timetable.length === 0) {
        return (
            <Card className="h-full border-0 shadow-lg shadow-indigo-900/5 bg-white col-span-1 lg:col-span-2">
                <CardHeader className="pb-3 border-b border-gray-50">
                    <CardTitle className="text-lg font-bold text-gray-800">My Timetable</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="text-center text-gray-500 py-8">
                        <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>No classes scheduled yet</p>
                        <p className="text-sm mt-1">Your timetable will appear here once classes are assigned</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Group timetable by day
    const timetableByDay = DAYS_ORDER.reduce((acc, day) => {
        acc[day] = timetable.filter(slot => slot.day === day);
        return acc;
    }, {} as Record<string, typeof timetable>);

    // Get today's day name
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayClasses = timetableByDay[today] || [];

    return (
        <Tabs defaultValue="weekly" className="w-full col-span-1 lg:col-span-2">
            <Card className="h-full border-0 shadow-lg shadow-indigo-900/5 bg-white overflow-hidden">
                <CardHeader className="pb-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
                    <div>
                        <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                <Calendar className="w-5 h-5" />
                            </div>
                            My Timetable
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-gray-400 mt-1">
                            Your teaching schedule • {todayClasses.length} classes today
                        </CardDescription>
                    </div>
                    <TabsList className="bg-indigo-50/50 p-1 h-10 rounded-xl grid grid-cols-2 w-[200px]">
                        <TabsTrigger value="weekly" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs transition-all">Weekly</TabsTrigger>
                        <TabsTrigger value="daily" className="rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-bold text-xs transition-all">Today</TabsTrigger>
                    </TabsList>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <TabsContent value="weekly" className="m-0 p-4">
                        <div className="min-w-[500px]">
                            <div className="grid grid-cols-6 gap-2 mb-2 text-xs font-bold text-gray-500 bg-gray-50 p-2 rounded-md">
                                <div className="p-1">Time</div>
                                {DAYS_ORDER.slice(0, 5).map(day => (
                                    <div key={day} className={`p-1 ${day === today ? 'text-indigo-600' : ''}`}>
                                        {day}
                                        {day === today && <span className="ml-1 text-[10px]">•</span>}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                {TIME_SLOTS_ORDER.map((timeSlot, index) => (
                                    <div key={index} className="grid grid-cols-6 gap-2 text-xs text-gray-700 items-center border-b border-gray-50 pb-2 last:border-0">
                                        <div className="font-medium p-1 text-gray-500 whitespace-nowrap">{timeSlot}</div>
                                        {DAYS_ORDER.slice(0, 5).map(day => {
                                            const slot = timetableByDay[day]?.find(s => s.time_slot === timeSlot);
                                            if (!slot) {
                                                return <div key={day} className="p-2"></div>;
                                            }

                                            const subjectName = Array.isArray(slot.subjects)
                                                ? slot.subjects[0]?.name
                                                : slot.subjects?.name;
                                            const className = Array.isArray(slot.batches)
                                                ? slot.batches[0]?.name
                                                : slot.batches?.name || slot.class_name;

                                            const isBreak = slot.type === 'break';
                                            const isLab = slot.type === 'lab';

                                            return (
                                                <div
                                                    key={day}
                                                    className={`p-2 rounded-md font-medium text-center ${isBreak
                                                        ? 'bg-orange-50 text-orange-600'
                                                        : isLab
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : 'bg-indigo-50 text-indigo-700'
                                                        }`}
                                                >
                                                    {isBreak ? 'BREAK' : (
                                                        <>
                                                            <div className="font-semibold">{subjectName || 'N/A'}</div>
                                                            <div className="text-[10px] text-gray-600">{className}</div>
                                                            {isLab && <div className="text-[10px] text-blue-600">(Lab)</div>}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="daily" className="m-0 p-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{today}'s Classes</h3>
                                    <p className="text-sm text-gray-400">{todayClasses.length} classes scheduled</p>
                                </div>
                            </div>
                            {todayClasses.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                                    <p>No classes scheduled for today</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayClasses.map((slot, index) => {
                                        const subjectName = Array.isArray(slot.subjects)
                                            ? slot.subjects[0]?.name
                                            : slot.subjects?.name;
                                        const className = Array.isArray(slot.batches)
                                            ? slot.batches[0]?.name
                                            : slot.batches?.name || slot.class_name;

                                        const isBreak = slot.type === 'break';
                                        const isLab = slot.type === 'lab';

                                        return (
                                            <div
                                                key={slot.id || index}
                                                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isBreak ? 'bg-orange-50 border border-orange-100' :
                                                    isLab ? 'bg-blue-50 border border-blue-100' :
                                                        'bg-indigo-50 border border-indigo-100'
                                                    }`}
                                            >
                                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-sm ${isBreak ? 'bg-orange-100 text-orange-600' :
                                                    isLab ? 'bg-blue-100 text-blue-600' :
                                                        'bg-indigo-100 text-indigo-600'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-bold ${isBreak ? 'text-orange-700' :
                                                        isLab ? 'text-blue-700' :
                                                            'text-gray-900'
                                                        }`}>
                                                        {isBreak ? 'BREAK' : subjectName || 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        {slot.time_slot} {!isBreak && `• ${className}`}
                                                        {isLab && ' • Lab Session'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </CardContent>
            </Card>
        </Tabs>
    );
}
