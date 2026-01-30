
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Sparkles, CheckCircle2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";
import { format, eachDayOfInterval, parseISO } from "date-fns";

export function LeaveLetterWidget() {
    const { user } = useSession();
    const { toast } = useToast();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [subject, setSubject] = useState("");
    const [letterContent, setLetterContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState<"idle" | "absences" | "finding-subs" | "completing" | "done">("idle");
    const [progress, setProgress] = useState({ total: 0, current: 0 });

    const handleSubmit = async () => {
        if (!user || !startDate || !endDate || !subject || !letterContent) {
            toast({ title: "Error", description: "All fields are required for a formal submission", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        setStep("absences");
        try {
            // 1. Get Faculty ID
            const { data: faculty, error: fError } = await supabase
                .from('faculty')
                .select('id, name')
                .eq('id', user.id)
                .single();

            if (fError || !faculty) throw new Error("Could not find your faculty record");

            // 2. Create Absence Record (incorporating letter details into reason/metadata)
            const fullReason = `Subject: ${subject}\n\n${letterContent}`;
            const { data: absence, error: aError } = await supabase
                .from('faculty_absences')
                .insert([{
                    faculty_id: faculty.id,
                    start_date: startDate,
                    end_date: endDate,
                    reason: fullReason
                }])
                .select()
                .single();

            if (aError) throw aError;

            // 3. Find Affected Slots
            setStep("finding-subs");
            const dates = eachDayOfInterval({
                start: parseISO(startDate),
                end: parseISO(endDate)
            });

            // Get all regular slots for this faculty
            const { data: slots, error: sError } = await supabase
                .from('schedule_slots')
                .select('*, subjects(name)')
                .eq('faculty_id', faculty.id);

            if (sError) throw sError;

            const allAffectedDuties = [];
            for (const date of dates) {
                const dayName = format(date, 'EEEE');
                const daySlots = slots.filter(s => s.day === dayName);
                for (const slot of daySlots) {
                    allAffectedDuties.push({ date: format(date, 'yyyy-MM-dd'), slot, dayName });
                }
            }

            setProgress({ total: allAffectedDuties.length, current: 0 });

            // 4. Call AI for each slot and create substitution
            const substitutions = [];
            for (const duty of allAffectedDuties) {
                setProgress(prev => ({ ...prev, current: prev.current + 1 }));

                try {
                    const aiResponse = await fetch('http://127.0.0.1:5000/api/find-substitutes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            date: duty.date,
                            time_slot: duty.slot.time_slot,
                            day: duty.dayName,
                            absent_faculty_name: faculty.name,
                            class_name: duty.slot.class_name
                        })
                    });

                    if (!aiResponse.ok) throw new Error("AI Engine unreachable");
                    const aiData = await aiResponse.json();
                    const bestFit = aiData.recommendations?.find((r: any) => r.is_free) || aiData.recommendations?.[0];

                    if (bestFit) {
                        substitutions.push({
                            absence_id: absence.id,
                            schedule_slot_id: duty.slot.id,
                            substitute_faculty_id: bestFit.faculty_id,
                            date: duty.date,
                            status: 'Approved'
                        });
                    }
                } catch (aiErr) {
                    console.warn(`AI failed for slot ${duty.slot.id}:`, aiErr);
                    substitutions.push({
                        absence_id: absence.id,
                        schedule_slot_id: duty.slot.id,
                        date: duty.date,
                        status: 'Pending'
                    });
                }
            }

            // 5. Bulk insert substitutions
            if (substitutions.length > 0) {
                setStep("completing");
                const { error: subError } = await supabase.from('substitutions').insert(substitutions);
                if (subError) throw subError;
            }

            setStep("done");
            toast({ title: "Letter Submitted", description: `Your formal leave letter has been recorded.` });

            setTimeout(() => {
                setStep("idle");
                setIsSubmitting(false);
                setStartDate("");
                setEndDate("");
                setSubject("");
                setLetterContent("");
            }, 3000);

        } catch (error: any) {
            console.error(error);
            toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
            setIsSubmitting(false);
            setStep("idle");
        }
    };

    if (step === "done") {
        return (
            <Card className="h-full border-0 shadow-lg bg-green-50 border-green-100">
                <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-green-900">Letter Submitted</h3>
                        <p className="text-green-700 font-medium">Your request is being processed.</p>
                        <p className="text-sm text-green-600/80 mt-1">AI has automated substitutions for your classes.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-0 shadow-lg overflow-hidden bg-white">
            <CardHeader className="pb-3 border-b border-gray-50 bg-gradient-to-tr from-purple-50/50 to-white">
                <CardTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                        <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    Submit Leave Letter
                </CardTitle>
                <CardDescription className="text-xs font-medium text-gray-400">Formal submission with AI auto-recovery</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Start Date</Label>
                        <Input
                            type="date"
                            className="h-9 text-xs border-gray-100 bg-gray-50/50 focus:bg-white"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">End Date</Label>
                        <Input
                            type="date"
                            className="h-9 text-xs border-gray-100 bg-gray-50/50 focus:bg-white"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Letter Subject</Label>
                    <Input
                        placeholder="e.g. Application for Sick Leave"
                        className="h-9 text-xs border-gray-100 bg-gray-50/50 focus:bg-white"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Letter Body</Label>
                    <Textarea
                        placeholder="Write your formal letter here..."
                        className="min-h-[120px] text-xs border-gray-100 bg-gray-50/50 focus:bg-white resize-none"
                        value={letterContent}
                        onChange={(e) => setLetterContent(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !startDate || !endDate || !subject || !letterContent}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-100 transition-all h-10 font-black text-xs active:scale-95"
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {step === "absences" && "Sending Letter..."}
                            {step === "finding-subs" && `AI Auto-Fixing (${progress.current}/${progress.total})...`}
                            {step === "completing" && "Finalizing..."}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Send className="h-3.5 w-3.5" />
                            Submit Formal Letter
                        </div>
                    )}
                </Button>

                <div className="text-[10px] text-center text-gray-400 italic">
                    <Sparkles className="h-3 w-3 inline mr-1 text-purple-400" />
                    Substitutions will be handled automatically by AI.
                </div>
            </CardContent>
        </Card>
    );
}
