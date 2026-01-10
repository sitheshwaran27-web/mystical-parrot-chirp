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
import { Loader2, Download, Search, Brain, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Batch {
  id: string;
  name: string;
}

interface ScheduleSlot {
  id: string;
  day: string;
  time_slot: string;
  class_name: string;
  type: string;
  ai_score: number;
  subjects: { name: string } | null;
  faculty: { name: string } | null;
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS_ORDER = [
  "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
  "13:00-14:00", "14:00-15:00", "15:00-16:00"
];

const ViewTimetables = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");
  const [timetable, setTimetable] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);

  useEffect(() => { fetchBatches(); }, []);

  const fetchBatches = async () => {
    const { data } = await supabase.from("batches").select("id, name").order("name");
    setBatches(data || []);
    setBatchesLoading(false);
  };

  const fetchTimetable = async (batchName: string) => {
    if (!batchName) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("schedule_slots")
      .select(`id, day, time_slot, class_name, type, ai_score, subjects (name), faculty (name)`)
      .eq("class_name", batchName);

    if (error) {
      showError("Failed to fetch timetable.");
    } else {
      setTimetable(data as any[]);
    }
    setLoading(false);
  };

  const handleCellClick = (slot: ScheduleSlot | null) => {
    if (slot) setSelectedSlot(slot);
  };

  const getCellContent = (day: string, timeSlot: string) => {
    const slot = timetable.find((s) => s.day === day && s.time_slot === timeSlot);
    if (!slot) return <div className="h-full w-full bg-slate-50 border border-dashed rounded" />;

    const isHighConfidence = slot.ai_score > 10;

    return (
      <div 
        onClick={() => handleCellClick(slot)}
        className={`p-2 rounded-md text-xs h-full flex flex-col justify-center items-center text-center cursor-pointer transition-all hover:ring-2 hover:ring-primary/50
          ${slot.type === 'lab' ? "bg-blue-100 border border-blue-200" : "bg-emerald-100 border border-emerald-200"}
        `}
      >
        <div className="flex items-center gap-1 mb-1">
            <span className="font-bold">{slot.subjects?.name || "N/A"}</span>
            {isHighConfidence && <Brain className="h-3 w-3 text-blue-500" title="AI High Confidence Slot" />}
        </div>
        <span className="opacity-70">{slot.faculty?.name || "N/A"}</span>
        <div className="mt-1 text-[8px] px-1 bg-white/50 rounded">Score: {slot.ai_score}</div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Intelligence Timetable View</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Select Search Target</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Select onValueChange={(v) => { setSelectedBatchName(v); fetchTimetable(v); }} value={selectedBatchName}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder={batchesLoading ? "Loading Batches..." : "Select a batch"} />
              </SelectTrigger>
              <SelectContent>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.name}>{batch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : selectedBatchName && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Schedule: {selectedBatchName}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-emerald-300" /> Theory
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-blue-300" /> Lab
                    </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
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
                          <TableCell key={`${day}-${time}`} className="p-1 h-24 align-top w-40">
                            {getCellContent(day, time)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                AI Slot Analysis
              </DialogTitle>
              <DialogDescription>
                Details for {selectedSlot?.subjects?.name} at {selectedSlot?.time_slot} on {selectedSlot?.day}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded bg-slate-50">
                  <div className="text-[10px] uppercase text-muted-foreground font-bold">Optimization Score</div>
                  <div className="text-xl font-bold text-blue-600">{selectedSlot?.ai_score}</div>
                </div>
                <div className="p-3 border rounded bg-slate-50">
                  <div className="text-[10px] uppercase text-muted-foreground font-bold">Confidence</div>
                  <div className="text-xl font-bold text-emerald-600">
                    {selectedSlot && selectedSlot.ai_score > 10 ? 'High' : 'Moderate'}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Info className="h-4 w-4" /> AI Recommendation
                </h4>
                <p className="text-xs text-muted-foreground">
                  The AI suggests this slot is optimal because {selectedSlot?.faculty?.name} has historically performed well during the {selectedSlot?.time_slot} window on {selectedSlot?.day}s.
                </p>
              </div>
              <Button className="w-full" variant="outline" onClick={() => setSelectedSlot(null)}>Close Analysis</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ViewTimetables;