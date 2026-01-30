"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Brain, Info, UserPlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useTimetableSlots } from "@/hooks/useTimetableSlots";
import { Calendar } from "lucide-react";

interface ScheduleSlot {
  id: string;
  day: string;
  time_slot: string;
  class_name: string;
  type: string;
  ai_score: number;
  subject_id?: string;
  subjects: { name: string } | null;
  faculty: { name: string } | null;
}

interface Recommendation {
  id: string;
  name: string;
  score: number;
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const ViewTimetables = () => {
  const { slots: TIME_SLOTS_ORDER, loading: slotsLoading } = useTimetableSlots();
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");
  const [timetable, setTimetable] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => { fetchBatches(); }, []);

  const fetchBatches = async () => {
    const { data } = await supabase.from("batches").select("id, name").order("name");
    setBatches(data || []);
  };

  const fetchTimetable = async (batchName: string) => {
    if (!batchName) return;
    setLoading(true);
    const { data } = await supabase
      .from("schedule_slots")
      .select(`id, day, time_slot, class_name, type, ai_score, subject_id, subjects (name), faculty (name)`)
      .eq("class_name", batchName);
    setTimetable(data as any[] || []);
    setLoading(false);
  };

  const handleCellClick = async (slot: ScheduleSlot) => {
    setSelectedSlot(slot);
    setRecLoading(true);
    try {
      const response = await fetch(`https://bcfkkrfrzutbmhdbosaa.supabase.co/functions/v1/ai-timetable-engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'recommend',
          day: slot.day,
          time_slot: slot.time_slot,
          subject_id: slot.subject_id
        })
      });
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (e) {
      console.error("Failed to fetch recommendations");
    } finally {
      setRecLoading(false);
    }
  };

  const getCellContent = (day: string, timeSlot: string) => {
    const slot = timetable.find((s) => s.day === day && s.time_slot === timeSlot);
    if (!slot) return <div className="h-full w-full bg-slate-50 border border-dashed rounded" />;

    return (
      <div
        onClick={() => handleCellClick(slot)}
        className={`p-2 rounded-md text-xs h-full flex flex-col justify-center items-center text-center cursor-pointer transition-all hover:ring-2 hover:ring-primary/50
          ${slot.type === 'lab' ? "bg-blue-100 border border-blue-200" : "bg-emerald-100 border border-emerald-200"}
        `}
      >
        <div className="flex items-center gap-1 mb-1">
          <span className="font-bold">{slot.subjects?.name || "N/A"}</span>
          {slot.ai_score > 30 && <Brain className="h-3 w-3 text-blue-500" />}
        </div>
        <span className="opacity-70">{slot.faculty?.name || "N/A"}</span>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Calendar className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-0">Time Table View</h1>
        </div>

        <Card className="mb-8">
          <CardHeader><CardTitle className="text-lg">Select Batch</CardTitle></CardHeader>
          <CardContent>
            <Select onValueChange={(v) => { setSelectedBatchName(v); fetchTimetable(v); }} value={selectedBatchName}>
              <SelectTrigger className="w-[280px]"><SelectValue placeholder="Select a batch" /></SelectTrigger>
              <SelectContent>
                {batches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading || slotsLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
          selectedBatchName && (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Time</TableHead>
                    {DAYS_ORDER.map(day => <TableHead key={day} className="text-center">{day}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TIME_SLOTS_ORDER.map(time => (
                    <TableRow key={time}>
                      <TableCell className="font-mono text-[10px]">{time}</TableCell>
                      {DAYS_ORDER.map(day => (
                        <TableCell key={`${day}-${time}`} className="p-1 h-24 w-40">
                          {getCellContent(day, time)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        )}

        <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-blue-600" /> AI Slot Intelligence</DialogTitle>
              <DialogDescription>Analyzing alternatives for {selectedSlot?.day} at {selectedSlot?.time_slot}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded bg-slate-50 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Current Subject</div>
                  <div className="font-bold">{selectedSlot?.subjects?.name}</div>
                </div>
                <div className="p-3 border rounded bg-slate-50 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Optimization</div>
                  <div className="font-bold text-emerald-600">{selectedSlot?.ai_score}%</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> AI Recommended Faculty</h4>
                {recLoading ? <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Calculating best fit...</div> : (
                  <div className="space-y-2">
                    {recommendations.map(rec => (
                      <div key={rec.id} className="flex justify-between items-center p-2 border rounded hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{rec.name}</span>
                          <span className="text-[10px] text-muted-foreground">Suitability Score: {rec.score}</span>
                        </div>
                        <Button size="sm" variant="ghost" className="text-xs h-8"><UserPlus className="h-3 w-3 mr-1" /> Re-assign</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0" />
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  The AI heuristic analyzes teacher workload, past performance during this hour, and cross-batch availability to generate these recommendations.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ViewTimetables;