"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Download } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useTimetableSlots } from "@/hooks/useTimetableSlots";

interface ScheduleSlot {
  id: string;
  day: string;
  time_slot: string;
  class_name: string;
  subject_id?: string;
  faculty_id?: string;
  type: string; // "theory", "lab", "break"
  subjects: { name: string } | { name: string }[] | null;
  faculty: { name: string } | { name: string }[] | null;
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TimetableDisplay: React.FC = () => {
  const { profile, loading: sessionLoading } = useSession();
  const { slots: TIME_SLOTS_ORDER, loading: slotsLoading } = useTimetableSlots();
  const [timetable, setTimetable] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("weekly");

  const fetchTimetable = useCallback(async () => {
    if (!profile?.class_name) {
      setError("No class assigned to your profile.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("schedule_slots")
      .select(`
        id,
        day,
        time_slot,
        class_name,
        type,
        subject_id,
        faculty_id,
        subjects (name),
        faculty (name)
      `)
      .eq("class_name", profile.class_name)
      .order("day", { ascending: true })
      .order("time_slot", { ascending: true });

    if (error) {
      console.error("Error fetching timetable:", error);
      showError("Failed to fetch timetable.");
      setError("Failed to load timetable. Please try again later.");
      setTimetable([]);
    } else {
      setTimetable(data as unknown as ScheduleSlot[]);
      showSuccess("Timetable loaded successfully.");
    }
    setLoading(false);
  }, [profile?.class_name]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchTimetable();
    }
  }, [sessionLoading, fetchTimetable]);

  const getCellContent = (day: string, timeSlot: string) => {
    const slot = timetable.find(
      (s) => s.day === day && s.time_slot === timeSlot
    );

    if (!slot) {
      return null;
    }

    const isLab = slot.type === "lab";
    const isBreak = slot.type === "break";

    const subjectName = Array.isArray(slot.subjects)
      ? slot.subjects[0]?.name
      : slot.subjects?.name;
    const facultyName = Array.isArray(slot.faculty)
      ? slot.faculty[0]?.name
      : slot.faculty?.name;

    return (
      <div
        className={`p-2 rounded-md text-xs h-full flex flex-col justify-center items-center text-center
          ${isLab ? "bg-blue-100 text-blue-800 border border-blue-300" : ""}
          ${isBreak ? "bg-gray-200 text-gray-700 border border-gray-300" : ""}
          ${!isLab && !isBreak ? "bg-green-100 text-green-800 border border-green-300" : ""}
        `}
      >
        {isBreak ? (
          <span className="font-semibold">Break</span>
        ) : (
          <>
            <span className="font-semibold">{subjectName || "N/A"}</span>
            <span>{facultyName || "N/A"}</span>
            {isLab && <span className="text-blue-600">(Lab)</span>}
          </>
        )}
      </div>
    );
  };

  const renderWeeklyView = () => {
    const days = DAYS_ORDER.filter(day => timetable.some(slot => slot.day === day));
    const timeSlots = TIME_SLOTS_ORDER.filter(time => timetable.some(slot => slot.time_slot === time));

    if (days.length === 0 || timeSlots.length === 0) {
      return <p className="text-center text-muted-foreground">No timetable data available for weekly view.</p>;
    }

    return (
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Time</TableHead>
              {days.map((day) => (
                <TableHead key={day} className="text-center">
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((timeSlot) => (
              <TableRow key={timeSlot}>
                <TableCell className="font-medium">{timeSlot}</TableCell>
                {days.map((day) => (
                  <TableCell key={`${day}-${timeSlot}`} className="p-1 h-24 align-top">
                    {getCellContent(day, timeSlot)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderDayWiseView = () => {
    const daysWithSchedule = DAYS_ORDER.filter(day => timetable.some(slot => slot.day === day));

    if (daysWithSchedule.length === 0) {
      return <p className="text-center text-muted-foreground">No timetable data available for day-wise view.</p>;
    }

    return (
      <div className="space-y-8">
        {daysWithSchedule.map((day) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle>{day}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Time</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Faculty</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TIME_SLOTS_ORDER.map((timeSlot) => {
                    const slot = timetable.find(
                      (s) => s.day === day && s.time_slot === timeSlot
                    );
                    if (!slot) return null;
                    return (
                      <TableRow key={slot.id}>
                        <TableCell className="font-medium">{slot.time_slot}</TableCell>
                        <TableCell>{(Array.isArray(slot.subjects) ? slot.subjects[0]?.name : slot.subjects?.name) || "N/A"}</TableCell>
                        <TableCell>{(Array.isArray(slot.faculty) ? slot.faculty[0]?.name : slot.faculty?.name) || "N/A"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold
                              ${slot.type === "lab" ? "bg-blue-100 text-blue-800" : ""}
                              ${slot.type === "break" ? "bg-gray-200 text-gray-700" : ""}
                              ${slot.type === "theory" ? "bg-green-100 text-green-800" : ""}
                            `}
                          >
                            {slot.type.charAt(0).toUpperCase() + slot.type.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderClassWiseView = () => {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          As a student, you are viewing the timetable for your assigned class:{" "}
          <span className="font-semibold text-primary">{profile?.class_name || "N/A"}</span>.
        </p>
        {renderWeeklyView()}
      </div>
    );
  };

  const exportTimetableAsPdf = () => {
    if (timetable.length === 0) {
      showError("No timetable data to export.");
      return;
    }

    const doc = new jsPDF();
    const class_name = profile?.class_name || "Unknown Class";
    doc.setFontSize(16);
    doc.text(`Timetable for Class: ${class_name}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);

    const tableColumn = ["Time Slot", ...DAYS_ORDER.filter(day => timetable.some(slot => slot.day === day))];
    const tableRows: string[][] = [];

    const timeSlots = TIME_SLOTS_ORDER.filter(time => timetable.some(slot => slot.time_slot === time));
    const days = DAYS_ORDER.filter(day => timetable.some(slot => slot.day === day));

    timeSlots.forEach(timeSlot => {
      const rowData: string[] = [timeSlot];
      days.forEach(day => {
        const slot = timetable.find(s => s.day === day && s.time_slot === timeSlot);
        if (slot) {
          const sName = Array.isArray(slot.subjects) ? slot.subjects[0]?.name : slot.subjects?.name;
          const fName = Array.isArray(slot.faculty) ? slot.faculty[0]?.name : slot.faculty?.name;
          const content = slot.type === "break"
            ? "Break"
            : `${sName || "N/A"}\n${fName || "N/A"}${slot.type === "lab" ? " (Lab)" : ""}`;
          rowData.push(content);
        } else {
          rowData.push("");
        }
      });
      tableRows.push(rowData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255] },
      columnStyles: { 0: { cellWidth: 25 } },
    });

    doc.save(`Timetable_${class_name}.pdf`);
    showSuccess("Timetable exported as PDF.");
  };

  if (sessionLoading || loading || slotsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading timetable...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>{error}</p>
        <Button onClick={fetchTimetable} className="mt-4">Retry</Button>
      </div>
    );
  }

  if (timetable.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-lg text-muted-foreground">No timetable available for your class at the moment.</p>
        <p className="text-sm text-muted-foreground mt-2">Please contact your administrator if you believe this is an error.</p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Timetable</CardTitle>
        <Button onClick={exportTimetableAsPdf} variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export as PDF
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="day-wise">Day-wise View</TabsTrigger>
            <TabsTrigger value="class-wise">Class-wise View</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly" className="mt-4">
            {renderWeeklyView()}
          </TabsContent>
          <TabsContent value="day-wise" className="mt-4">
            {renderDayWiseView()}
          </TabsContent>
          <TabsContent value="class-wise" className="mt-4">
            {renderClassWiseView()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TimetableDisplay;