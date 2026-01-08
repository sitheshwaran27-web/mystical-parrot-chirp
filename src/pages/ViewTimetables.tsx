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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
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
  subjects: { name: string } | null;
  faculty: { name: string } | null;
  rooms: { name: string } | null;
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS_ORDER = [
  "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
  "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00",
  "16:00-17:00", "17:00-18:00"
];

const ViewTimetables = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchName, setSelectedBatchName] = useState<string>("");
  const [timetable, setTimetable] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setBatchesLoading(true);
    const { data, error } = await supabase.from("batches").select("id, name").order("name");
    if (error) {
      showError("Failed to load batches.");
    } else {
      setBatches(data || []);
    }
    setBatchesLoading(false);
  };

  const fetchTimetable = async (batchName: string) => {
    if (!batchName) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("schedule_slots")
      .select(`
        id,
        day,
        time_slot,
        class_name,
        type,
        subjects (name),
        faculty (name),
        rooms (name)
      `)
      .eq("class_name", batchName)
      .order("day", { ascending: true })
      .order("time_slot", { ascending: true });

    if (error) {
      showError("Failed to fetch timetable.");
      setTimetable([]);
    } else {
      setTimetable(data as ScheduleSlot[]);
    }
    setLoading(false);
  };

  const handleBatchChange = (name: string) => {
    setSelectedBatchName(name);
    fetchTimetable(name);
  };

  const getCellContent = (day: string, timeSlot: string) => {
    const slot = timetable.find((s) => s.day === day && s.time_slot === timeSlot);
    if (!slot) return null;

    const isLab = slot.type === "lab";
    const isBreak = slot.type === "break";

    return (
      <div className={`p-2 rounded-md text-xs h-full flex flex-col justify-center items-center text-center
          ${isLab ? "bg-blue-100 text-blue-800 border border-blue-300" : ""}
          ${isBreak ? "bg-gray-200 text-gray-700 border border-gray-300" : ""}
          ${!isLab && !isBreak ? "bg-green-100 text-green-800 border border-green-300" : ""}
        `}>
        {isBreak ? (
          <span className="font-semibold">Break</span>
        ) : (
          <>
            <span className="font-semibold">{slot.subjects?.name || "N/A"}</span>
            <span>{slot.faculty?.name || "N/A"}</span>
            <span>{slot.rooms?.name || "N/A"}</span>
            {isLab && <span className="text-blue-600">(Lab)</span>}
          </>
        )}
      </div>
    );
  };

  const exportAsPdf = () => {
    if (timetable.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Timetable for ${selectedBatchName}`, 14, 20);
    
    const days = DAYS_ORDER.filter(day => timetable.some(slot => slot.day === day));
    const timeSlots = TIME_SLOTS_ORDER.filter(time => timetable.some(slot => slot.time_slot === time));
    
    const tableColumn = ["Time Slot", ...days];
    const tableRows: string[][] = [];

    timeSlots.forEach(time => {
      const row = [time];
      days.forEach(day => {
        const slot = timetable.find(s => s.day === day && s.time_slot === time);
        if (slot) {
          row.push(slot.type === "break" ? "Break" : `${slot.subjects?.name || ""}\n${slot.faculty?.name || ""}\n${slot.rooms?.name || ""}`);
        } else {
          row.push("");
        }
      });
      tableRows.push(row);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
    doc.save(`Timetable_${selectedBatchName}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">View Timetables</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Select Batch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 max-w-sm">
              <Select onValueChange={handleBatchChange} value={selectedBatchName}>
                <SelectTrigger>
                  <SelectValue placeholder={batchesLoading ? "Loading..." : "Select a batch"} />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.name}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => fetchTimetable(selectedBatchName)} disabled={!selectedBatchName || loading}>
                <Search className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : selectedBatchName && timetable.length > 0 ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Timetable: {selectedBatchName}</CardTitle>
              <Button variant="outline" onClick={exportAsPdf}>
                <Download className="mr-2 h-4 w-4" /> Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Time</TableHead>
                      {DAYS_ORDER.filter(day => timetable.some(s => s.day === day)).map(day => (
                        <TableHead key={day} className="text-center">{day}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TIME_SLOTS_ORDER.filter(time => timetable.some(s => s.time_slot === time)).map(time => (
                      <TableRow key={time}>
                        <TableCell className="font-medium text-xs">{time}</TableCell>
                        {DAYS_ORDER.filter(day => timetable.some(s => s.day === day)).map(day => (
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
        ) : selectedBatchName ? (
          <div className="text-center py-12 text-muted-foreground">
            No timetable found for this batch.
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            Please select a batch to view its timetable.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ViewTimetables;