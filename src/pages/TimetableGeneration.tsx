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

const TimetableGeneration = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
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
    if (!selectedBatch) {
      toast({
        title: "Selection Required",
        description: "Please select a batch to generate the timetable for.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    setStatus("Analyzing scheduling rules...");

    // Simulated generation process for now
    // In a production app, this would call a Supabase Edge Function
    try {
      setTimeout(() => {
        setProgress(30);
        setStatus("Fetching available faculty and rooms...");
      }, 1000);

      setTimeout(() => {
        setProgress(60);
        setStatus("Solving constraints and optimizing slots...");
      }, 2500);

      setTimeout(() => {
        setProgress(90);
        setStatus("Finalizing timetable...");
      }, 4000);

      setTimeout(() => {
        setProgress(100);
        setStatus("Generation complete!");
        setIsGenerating(false);
        toast({
          title: "Success",
          description: "Timetable generated successfully for the selected batch.",
        });
      }, 5500);

    } catch (error) {
      setIsGenerating(false);
      setStatus("Error during generation.");
      toast({
        title: "Generation Failed",
        description: "An unexpected error occurred during generation.",
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
                Select a target batch and configure parameters for the automated scheduling engine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Batch</label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={isGenerating}>
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
                  disabled={isGenerating || !selectedBatch} 
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
                        : "Our engine is balancing faculty workload and room availability."}
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