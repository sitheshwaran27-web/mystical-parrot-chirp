"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Play, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface Batch {
  id: string;
  name: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIME_SLOTS = [
  "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
  "13:00-14:00", "14:00-15:00", "15:00-16:00"
];

const TimetableGeneration = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("batches").select("id, name");
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load batches.",
        variant: "destructive",
      });
    } else {
      setBatches(data || []);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!selectedBatchId) {
      toast({
        title: "Selection Required",
        description: "Please select a batch to generate the timetable for.",
        variant: "destructive",
      });
      return;
    }

    const batch = batches.find(b => b.id === selectedBatchId);
    if (!batch) return;

    setIsGenerating(true);
    setProgress(5);
    setStatus("Fetching resources...");

    try {
      // 1. Fetch resources
      const [subjectsRes, facultyRes, roomsRes] = await Promise.all([
        supabase.from("subjects").select("id, name, type"),
        supabase.from("faculty").select("id, name"),
        supabase.from("rooms").select("id, name")
      ]);

      if (!subjectsRes.data?.length || !facultyRes.data?.length || !roomsRes.data?.length) {
        throw new Error("Insufficient resources (subjects, faculty, or rooms) to generate a timetable.");
      }

      setProgress(20);
      setStatus(`Clearing existing schedule for ${batch.name}...`);

      // 2. Clear existing slots for this batch
      const { error: deleteError } = await supabase
        .from("schedule_slots")
        .delete()
        .eq("class_name", batch.name);

      if (deleteError) throw deleteError;

      setProgress(40);
      setStatus("Assigning slots...");

      // 3. Simple generation logic: Fill slots sequentially with available resources
      const newSlots = [];
      let subjectIndex = 0;
      let facultyIndex = 0;
      let roomIndex = 0;

      for (const day of DAYS) {
        for (const timeSlot of TIME_SLOTS) {
          const subject = subjectsRes.data[subjectIndex % subjectsRes.data.length];
          const faculty = facultyRes.data[facultyIndex % facultyRes.data.length];
          const room = roomsRes.data[roomIndex % roomsRes.data.length];

          newSlots.push({
            day,
            time_slot: timeSlot,
            class_name: batch.name,
            subject_id: subject.id,
            faculty_id: faculty.id,
            room_id: room.id,
            type: subject.type || "theory"
          });

          subjectIndex++;
          facultyIndex++;
          roomIndex++;
        }
        
        // Add a lunch break slot
        newSlots.push({
          day,
          time_slot: "12:00-13:00",
          class_name: batch.name,
          type: "break"
        });
      }

      setProgress(70);
      setStatus("Saving generated schedule...");

      // 4. Batch insert into Supabase
      const { error: insertError } = await supabase
        .from("schedule_slots")
        .insert(newSlots);

      if (insertError) throw insertError;

      setProgress(100);
      setStatus("Generation complete!");
      setIsGenerating(false);
      
      toast({
        title: "Success",
        description: `Timetable generated successfully for ${batch.name}.`,
      });

    } catch (error: any) {
      console.error("Generation error:", error);
      setIsGenerating(false);
      setStatus("Error during generation.");
      toast({
        title: "Generation Failed",
        description: error.message || "An unexpected error occurred during generation.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Timetable Generation</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Generator Settings</CardTitle>
              <CardDescription>
                Select a target batch to generate a fresh automated schedule. This will overwrite any existing timetable for that batch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Batch</label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading batches..." : "Select batch"} />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !selectedBatchId} 
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Generation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generation Status</CardTitle>
              <CardDescription>
                Monitor the progress of the timetable creation process.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isGenerating || progress > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-muted-foreground">{status}</span>
                    <span className="font-bold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center gap-2 text-sm">
                    {progress === 100 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    )}
                    <span>
                      {progress === 100 
                        ? "The schedule is now live and can be viewed." 
                        : "Processing assignments and constraints..."}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">No generation in progress</p>
                  <p className="text-sm text-muted-foreground">Select a batch and click "Start Generation" to begin.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TimetableGeneration;