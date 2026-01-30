
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FacultyAbsence, Substitution, RecommendedSubstitute } from "@/types/absence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, UserX, UserCheck, AlertTriangle, ArrowRight, Calendar } from "lucide-react";
import { format, addDays, isWithinInterval, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface UncoveredSlot {
    slot_id: string;
    day: string;
    time_slot: string;
    subject: string;
    class_name: string;
    date: Date;
    absence_id: string;
    absent_faculty_name: string;
}

export default function SubstitutionManager() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [uncoveredSlots, setUncoveredSlots] = useState<UncoveredSlot[]>([]);
    const [calculating, setCalculating] = useState(false);

    // Fetch Active Absences
    const { data: absences } = useQuery({
        queryKey: ['active_absences'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('faculty_absences')
                .select('*, faculty(name)')
                .gte('end_date', new Date().toISOString().split('T')[0]); // Not past
            if (error) throw error;
            return data as FacultyAbsence[];
        }
    });

    // Fetch existing substitutions
    const { data: existingSubs } = useQuery({
        queryKey: ['all_substitutions'],
        queryFn: async () => {
            const { data } = await supabase.from('substitutions').select('*');
            return data as Substitution[];
        }
    });

    // Calculate Uncovered Slots
    useEffect(() => {
        const calculate = async () => {
            if (!absences || !existingSubs) return;
            setCalculating(true);
            const uncovered: UncoveredSlot[] = [];

            for (const absence of absences) {
                // 1. Fetch regular slots for this faculty
                const { data: regularSlots } = await supabase
                    .from('schedule_slots')
                    .select('*, subjects(name)')
                    .eq('faculty_id', absence.faculty_id);

                if (!regularSlots) continue;

                // 2. Iterate dates in absence range
                let curr = new Date(absence.start_date);
                const end = new Date(absence.end_date);

                // Limit to next 14 days to avoid exploding loops
                let limit = 0;
                while (curr <= end && limit < 14) {
                    const dayName = format(curr, 'EEEE'); // Monday, Tuesday...

                    // Find slots for this day
                    const daysSlots = regularSlots.filter(s => s.day === dayName);

                    for (const slot of daysSlots) {
                        // Check if covered
                        const isCovered = existingSubs.some(sub =>
                            sub.schedule_slot_id === slot.id &&
                            sub.date === format(curr, 'yyyy-MM-dd')
                        );

                        if (!isCovered) {
                            uncovered.push({
                                slot_id: slot.id,
                                day: dayName,
                                time_slot: slot.time_slot,
                                subject: slot.subjects?.name || 'Unknown Subject',
                                class_name: slot.class_name,
                                date: new Date(curr),
                                absence_id: absence.id,
                                absent_faculty_name: absence.faculty?.name || 'Unknown'
                            });
                        }
                    }
                    curr = addDays(curr, 1);
                    limit++;
                }
            }
            // Sort by date nearby
            uncovered.sort((a, b) => a.date.getTime() - b.date.getTime());
            setUncoveredSlots(uncovered);
            setCalculating(false);
        };
        calculate();
    }, [absences, existingSubs]);

    if (calculating) return <div className="p-8 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /><p className="mt-2">Analyzing schedule...</p></div>;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium flex items-center gap-2">
                <AlertTriangle className="text-orange-500 h-5 w-5" />
                Uncovered Classes ({uncoveredSlots.length})
            </h3>

            {uncoveredSlots.length === 0 ? (
                <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                    No classes require substitution at this time.
                </div>
            ) : (
                <div className="grid gap-4">
                    {uncoveredSlots.map((slot, idx) => (
                        <SubstitutionCard key={`${slot.slot_id}-${slot.date.toISOString()}`} slot={slot} />
                    ))}
                </div>
            )}
        </div>
    );
}

function SubstitutionCard({ slot }: { slot: UncoveredSlot }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [loadingAI, setLoadingAI] = useState(false);
    const [recommendations, setRecommendations] = useState<RecommendedSubstitute[]>([]);
    const [selectedSub, setSelectedSub] = useState<string>("");

    const fetchRecommendations = async () => {
        setLoadingAI(true);
        try {
            const response = await fetch('http://127.0.0.1:5000/api/find-substitutes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: format(slot.date, 'yyyy-MM-dd'),
                    time_slot: slot.time_slot,
                    day: slot.day,
                    absent_faculty_name: slot.absent_faculty_name, // optional context
                    class_name: slot.class_name
                })
            });

            if (!response.ok) throw new Error("Failed to fetch substitutes");
            const data = await response.json();
            setRecommendations(data.recommendations || []);
            if (data.recommendations?.length > 0) {
                setSelectedSub(data.recommendations[0].faculty_id);
            }
        } catch (e) {
            toast({ title: "AI Error", description: "Could not fetch recommendations. Ensure backend is running.", variant: "destructive" });
        } finally {
            setLoadingAI(false);
        }
    };

    const confirmMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.from('substitutions').insert([{
                absence_id: slot.absence_id,
                schedule_slot_id: slot.slot_id,
                substitute_faculty_id: selectedSub,
                date: format(slot.date, 'yyyy-MM-dd'),
                status: 'Approved'
            }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all_substitutions'] });
            toast({ title: "Success", description: "Substitution assigned" });
        },
        onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" })
    });

    return (
        <Card>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Absent: {slot.absent_faculty_name}</Badge>
                        <Badge variant="secondary">{format(slot.date, 'MMM d')} ({slot.day})</Badge>
                    </div>
                    <div className="font-semibold text-lg">{slot.subject} - {slot.class_name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> {slot.time_slot}
                    </div>
                </div>

                <div className="w-full md:w-[400px] space-y-3">
                    {!recommendations.length ? (
                        <Button variant="secondary" className="w-full" onClick={fetchRecommendations} disabled={loadingAI}>
                            {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                            Find Substitute (AI)
                        </Button>
                    ) : (
                        <div className="space-y-2 animate-in fade-in">
                            <Label>Select Substitute</Label>
                            <Select value={selectedSub} onValueChange={setSelectedSub}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {recommendations.map(rec => (
                                        <SelectItem key={rec.faculty_id} value={rec.faculty_id}>
                                            <div className="flex justify-between items-center w-full gap-2">
                                                <span>{rec.faculty_name}</span>
                                                {rec.is_free ? <Badge variant="outline" className="text-green-600 text-[10px]">Free</Badge> : <Badge variant="outline" className="text-gray-400 text-[10px]">Busy</Badge>}
                                                <span className="text-xs text-muted-foreground">Load: {rec.workload_score}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button className="w-full" onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending || !selectedSub}>
                                {confirmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Assignment"}
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

