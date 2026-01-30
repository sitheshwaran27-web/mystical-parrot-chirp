
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/context/SessionContext";
import { format } from "date-fns";
import { Loader2, Calendar, MapPin, UserCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function InvigilationWidget() {
    const { profile, user } = useSession();
    const [duties, setDuties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDuties = async () => {
            if (!user?.id) return;

            try {
                // 1. Get Faculty ID
                const { data: facultyData } = await supabase
                    .from('faculty')
                    .select('id')
                    .eq('id', user.id)
                    .single(); // Might be null if admin or not linked

                if (!facultyData) {
                    setLoading(false);
                    return;
                }

                // 2. Fetch Invigilation Duties
                const { data, error } = await supabase
                    .from('invigilation_duties')
                    .select(`
                        id,
                        is_chief_invigilator,
                        exam_schedules (
                            exam_date,
                            session,
                            subjects (name, code),
                            exam_halls (name),
                            exams (name, morning_session_start, morning_session_end, afternoon_session_start, afternoon_session_end),
                            batch: batches (name)
                        )
                    `)
                    .eq('faculty_id', facultyData.id)
                    .order('created_at', { ascending: false }); // ideally order by exam_date, but it's nested

                if (error) throw error;

                // Sort by date JS side
                const sorted = (data || []).sort((a: any, b: any) =>
                    new Date(a.exam_schedules?.exam_date).getTime() - new Date(b.exam_schedules?.exam_date).getTime()
                );

                // Filter upcoming
                const upcoming = sorted.filter((d: any) => new Date(d.exam_schedules?.exam_date) >= new Date(new Date().setHours(0, 0, 0, 0)));

                setDuties(upcoming);
            } catch (err) {
                console.error("Error loading duties", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDuties();
    }, [profile]);

    if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;

    // If no duties, we might not want to show anything or show empty state
    // But since this is a specific request, let's show separate section or nothing.
    // If empty, return null or a happy state.
    if (duties.length === 0) return null;

    return (
        <Card className="border-orange-200 bg-orange-50/30">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                    <ShieldAlert className="w-5 h-5" />
                    Invigilation Duties
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {duties.map((duty) => (
                        <div key={duty.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-orange-200 rounded-lg bg-white/60 hover:bg-white transition-colors gap-2">
                            <div className="space-y-1">
                                <div className="font-semibold text-gray-800">
                                    {duty.exam_schedules?.subjects?.name}
                                </div>
                                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-800 hover:bg-orange-200">
                                        {duty.exam_schedules?.exams?.name}
                                    </Badge>
                                    <span className="font-medium text-gray-600">
                                        Class: {duty.exam_schedules?.batch?.name}
                                    </span>
                                    {duty.is_chief_invigilator && (
                                        <Badge className="text-[10px] bg-red-100 text-red-700">Chief</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:items-end text-sm space-y-1">
                                <div className="flex items-center gap-2 font-medium text-gray-700">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(duty.exam_schedules?.exam_date), 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <UserCheck className="w-3 h-3" />
                                        {duty.exam_schedules?.session}
                                        {duty.exam_schedules?.exams && (
                                            <span className="ml-1 text-[10px]">
                                                ({duty.exam_schedules.session === 'Morning'
                                                    ? `${duty.exam_schedules.exams.morning_session_start?.slice(0, 5)} - ${duty.exam_schedules.exams.morning_session_end?.slice(0, 5)}`
                                                    : `${duty.exam_schedules.exams.afternoon_session_start?.slice(0, 5)} - ${duty.exam_schedules.exams.afternoon_session_end?.slice(0, 5)}`
                                                })
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {duty.exam_schedules?.exam_halls?.name || "TBD"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
