
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Exam } from "@/types/exam";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2, Zap, Save, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";

export default function ExamScheduler() {
    const { toast } = useToast();
    const [selectedExamId, setSelectedExamId] = useState<string>("");
    const [generatedSchedule, setGeneratedSchedule] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch Active Exams
    const { data: exams, isLoading: isLoadingExams } = useQuery({
        queryKey: ['active_exams'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('exams')
                .select('*')
                .eq('is_active', true)
                .order('start_date');

            if (error) throw error;
            return data as Exam[];
        }
    });

    const generateMutation = useMutation({
        mutationFn: async (examId: string) => {
            const response = await fetch('http://127.0.0.1:5000/api/generate-exam-timetable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exam_id: examId })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to generate timetable');
            }
            return response.json();
        },
        onSuccess: (data) => {
            setGeneratedSchedule(data.schedule);
            toast({ title: "Generated", description: `Created ${data.schedule.length} exam slots.` });
        },
        onError: (error) => {
            toast({
                title: "Generation Failed",
                description: error.message + ". Make sure 'python backend/app.py' is running.",
                variant: "destructive"
            });
        }
    });

    const handleSave = async () => {
        if (!generatedSchedule.length || !selectedExamId) return;
        setIsSaving(true);
        try {
            // 1. Clear existing schedule for this exam?
            // Ideally yes, or we prevent overwrite. For now, clear to be safe.
            await supabase.from('exam_schedules').delete().eq('exam_id', selectedExamId);
            await supabase.from('invigilation_duties').delete().eq('exam_schedule_id', selectedExamId); // actually redundant if cascaded but safe

            // 2. Prepare inserts
            const scheduleInserts = generatedSchedule.map(slot => ({
                exam_id: slot.exam_id,
                subject_id: slot.subject_id,
                exam_date: slot.exam_date,
                session: slot.session,
                hall_id: slot.hall_id,
                batch_id: slot.batch_id
            }));

            const { data: insertedSchedules, error: scheduleError } = await supabase
                .from('exam_schedules')
                .insert(scheduleInserts)
                .select();

            if (scheduleError) throw scheduleError;

            // 3. Insert Invigilators
            if (insertedSchedules) {
                const dutyInserts = [];
                // We need to map back the generated invigilator to the inserted schedule ID
                // This is tricky because bulk insert doesn't guarantee order alignment easily.
                // WE match by (subject_id, batch_id) assuming uniqueness per exam

                for (const inserted of insertedSchedules) {
                    const original = generatedSchedule.find(
                        g => g.subject_id === inserted.subject_id && g.batch_id === inserted.batch_id
                    );
                    if (original && original.invigilator_id) {
                        dutyInserts.push({
                            exam_schedule_id: inserted.id,
                            faculty_id: original.invigilator_id,
                            is_chief_invigilator: false
                        });
                    }
                }

                if (dutyInserts.length > 0) {
                    const { error: dutyError } = await supabase.from('invigilation_duties').insert(dutyInserts);
                    if (dutyError) throw dutyError;
                }
            }

            toast({ title: "Saved", description: "Exam timetable published successfully." });
            setGeneratedSchedule([]);
            setSelectedExamId("");
        } catch (error: any) {
            toast({ title: "Save Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-4 items-end">
                <div className="space-y-2 w-[300px]">
                    <Label>Select Exam Cycle</Label>
                    <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an active exam" />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoadingExams ? <SelectItem value="loading" disabled>Loading...</SelectItem> :
                                exams?.length === 0 ? <SelectItem value="none" disabled>No active exams</SelectItem> :
                                    exams?.map(e => (
                                        <SelectItem key={e.id} value={e.id}>{e.name} ({e.type})</SelectItem>
                                    ))
                            }
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={() => generateMutation.mutate(selectedExamId)}
                    disabled={!selectedExamId || generateMutation.isPending}
                >
                    {generateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                    Generate Schedule
                </Button>
            </div>

            {generateMutation.isError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {generateMutation.error.message}
                    </AlertDescription>
                </Alert>
            )}

            {generatedSchedule.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                        <div>
                            <h4 className="font-semibold">Review Generated Schedule</h4>
                            <p className="text-sm text-muted-foreground">{generatedSchedule.length} exam slots proposed.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setGeneratedSchedule([])}>Discard</Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Pubish Timetable
                            </Button>
                        </div>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Session</TableHead>
                                    <TableHead>Batches/Subjects</TableHead>
                                    <TableHead>Hall</TableHead>
                                    <TableHead>Invigilator</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {generatedSchedule.map((slot, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{format(new Date(slot.exam_date), 'MMM d, yyyy')}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs ${slot.session === 'Morning' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {slot.session}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{slot.subject_name}</div>
                                        </TableCell>
                                        <TableCell>{slot.hall_name || "Unassigned"}</TableCell>
                                        <TableCell>{slot.invigilator_name || "Unassigned"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
