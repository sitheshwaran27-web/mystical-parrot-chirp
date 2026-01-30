import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassTimetableWidget } from "@/components/dashboard/widgets/ClassTimetableWidget";
import { ExamTimetableWidget } from "@/components/dashboard/widgets/ExamTimetableWidget";
import { useSession } from "@/hooks/use-session";
import { useStudentTimetable } from "@/hooks/useStudentTimetable";
import { Loader2, Calendar, FlaskConical, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const StudentDashboard = () => {
  const { profile, loading: sessionLoading } = useSession();
  const { loading: timetableLoading, getTodayClasses, getNextClass, timetable } = useStudentTimetable();

  const loading = sessionLoading || timetableLoading;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2">Loading your schedule...</span>
      </div>
    );
  }

  const todayClasses = getTodayClasses();
  const nextClass = getNextClass();
  const labClasses = timetable.filter(s => s.type === 'lab');
  const nextLab = labClasses[0]; // Simple logic for next lab

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header Section from Mockup */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Hello, <span className="text-emerald-600">{profile?.first_name || "Student"}</span>!
            </h2>
            <p className="text-gray-500 mt-1 font-medium">
              Here's what's happening with your studies today.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Time</p>
              <p className="text-sm font-bold text-gray-900">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* Top Stats Cards - Redesigned like Mockup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Today's Schedule Card */}
          <Card className="border-0 shadow-lg shadow-emerald-900/5 bg-white overflow-hidden relative group transition-all hover:shadow-xl hover:shadow-emerald-900/10">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardContent className="p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Today's Schedule</h3>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-6xl font-black text-emerald-600">{todayClasses.length}</span>
                    <span className="text-xl font-bold text-gray-400">Classes</span>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit">
                    <Calendar className="h-4 w-4" />
                    {nextClass ? `Next: ${nextClass.subjects?.name} at ${nextClass.time_slot.split('-')[0]}` : "No more classes today"}
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 transform transition-transform group-hover:scale-110">
                  <Calendar className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Lab Card */}
          <Card className="border-0 shadow-lg shadow-emerald-900/5 bg-white overflow-hidden relative group transition-all hover:shadow-xl hover:shadow-emerald-900/10">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <CardContent className="p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Upcoming Lab</h3>
                  <p className="text-2xl font-black text-blue-600 mt-4 tracking-tight">
                    {nextLab ? nextLab.subjects?.name : "No Labs Scheduled"}
                  </p>
                  <p className="text-gray-400 font-bold mt-1 uppercase text-xs tracking-widest">
                    {nextLab ? `Room ${nextLab.room_id || 'TBD'}` : "Check back later"}
                  </p>

                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>Preparation Progress</span>
                      <span>{nextLab ? '100%' : '0%'}</span>
                    </div>
                    <Progress value={nextLab ? 100 : 0} className="h-2 bg-blue-50" />
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 transform transition-transform group-hover:scale-110">
                  <FlaskConical className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timetable Section */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-4 transition-all duration-500 ease-in-out space-y-8">
            <ExamTimetableWidget />
            <ClassTimetableWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;