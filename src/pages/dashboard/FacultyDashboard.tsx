
import React from "react";
import { StatCard } from "@/components/dashboard/widgets/StatCard";
import { FacultyTimetableWidget } from "@/components/dashboard/widgets/FacultyTimetableWidget";
import { InvigilationWidget } from "@/components/dashboard/widgets/InvigilationWidget";
import { LeaveLetterWidget } from "@/components/dashboard/widgets/LeaveLetterWidget";
import { BookOpen, Clock, FileText } from "lucide-react";
import { useFacultyTimetable } from "@/hooks/useFacultyTimetable";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";

export default function FacultyDashboard() {
    const { user } = useSession();
    const { toast } = useToast();
    const { timetable, loading, error } = useFacultyTimetable();

    const handleHealFaculty = async () => {
        if (!user) return;
        try {
            const userEmail = user.email || "";
            const userName = userEmail.split('@')[0] || 'User';

            const { error: healError } = await supabase.from('faculty').upsert({
                id: user.id,
                name: userName,
                email: userEmail,
                priority: 'junior',
                department: 'Computer Science'
            });

            if (healError) throw healError;

            toast({ title: "Connected!", description: "Your faculty record is now linked. Refreshing..." });
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
        }
    };

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
            {error === "Could not find faculty record" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800">Account Connection Required</h3>
                            <p className="text-sm text-amber-700">Your login is successful, but your faculty record isn't linked to your timetable yet.</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleHealFaculty}
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-2 whitespace-nowrap"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Connect My Record
                    </Button>
                </div>
            )}

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
