
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/context/SessionContext";
import { format } from "date-fns";
import { Loader2, Calendar, FileText, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ExamTimetableWidget() {
    const { profile } = useSession();
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExams = async () => {
            if (!profile?.class_name) {
                setLoading(false);
                return;
            }

            try {
                // 1. Get Batch ID from class_name
                const { data: batches } = await supabase
                    .from('batches')
                    .select('id')
                    .eq('name', profile.class_name)
                    .single();

                if (!batches) {
                    setLoading(false);
                    return;
                }

                // 2. Fetch schedules
                const { data, error } = await supabase
                    .from('exam_schedules')
                    .select(`
                        id,
                        exam_date,
                        session,
                        subjects (name, code),
                        exam_halls (name),
                        exams (name, type, morning_session_start, morning_session_end, afternoon_session_start, afternoon_session_end)
                    `)
                    .eq('batch_id', batches.id)
                    .gte('exam_date', new Date().toISOString().split('T')[0]) // Upcoming only
                    .order('exam_date', { ascending: true });

                if (error) throw error;
                setExams(data || []);
            } catch (err) {
                console.error("Error loading exams", err);
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, [profile]);

    if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (exams.length === 0) return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Upcoming Exams
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                    No upcoming exams scheduled.
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Upcoming Exams
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {exams.map((exam) => (
                        <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-card/50 hover:bg-accent/50 transition-colors gap-2">
                            <div className="space-y-1">
                                <div className="font-semibold text-primary">{exam.subjects?.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">{exam.exams?.name}</Badge>
                                    <span>{exam.subjects?.code}</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:items-end text-sm space-y-1">
                                <div className="flex items-center gap-2 font-medium">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(exam.exam_date), 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {exam.session}
                                        {exam.exams && (
                                            <span className="text-[10px] opacity-80">
                                                ({exam.session === 'Morning'
                                                    ? `${exam.exams.morning_session_start?.slice(0, 5)} - ${exam.exams.morning_session_end?.slice(0, 5)}`
                                                    : `${exam.exams.afternoon_session_start?.slice(0, 5)} - ${exam.exams.afternoon_session_end?.slice(0, 5)}`
                                                })
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {exam.exam_halls?.name || "TBD"}
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
