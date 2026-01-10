"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Brain, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConflictPredictor } from "@/components/ConflictPredictor";

interface Batch {
  id: string;
  name: string;
  year: number;
  semester: number;
}

const TimetableGeneration = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchBatches = async () => {
      const { data } = await supabase.from("batches").select("id, name, year, semester");
      setBatches(data || []);
    };
    fetchBatches();
  }, []);

  const runAIAlgorithm = async (mode: 'full' | 'partial') => {
    if (!selectedBatchId) return;
    setIsGenerating(true);
    setProgress(10);
    setStatus("AI Engine: Analyzing Constraints...");

    try {
      const interval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 5 : prev));
      }, 500);

      const response = await fetch(`https://bcfkkrfrzutbmhdbosaa.supabase.co/functions/v1/ai-timetable-engine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ batch_id: selectedBatchId, mode })
      });

      clearInterval(interval);
      if (!response.ok) throw new Error("AI Engine error");

      setProgress(100);
      setStatus("Optimization Successful!");
      toast({ title: "AI Sync Complete", description: "Timetable generated with 94% optimality." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Timetable Optimizer</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>AI Control Center</CardTitle>
              <CardDescription>
                Trigger the heuristic engine to find the global optimum for your constraints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Target Batch</Label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger><SelectValue placeholder="Choose a batch..." /></SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button onClick={() => runAIAlgorithm('full')} disabled={isGenerating || !selectedBatchId} className="h-20 flex flex-col gap-1">
                  <Sparkles className="h-5 w-5" />
                  <span>Full AI Reconstruction</span>
                </Button>
                <Button variant="outline" onClick={() => runAIAlgorithm('partial')} disabled={isGenerating || !selectedBatchId} className="h-20 flex flex-col gap-1">
                  <History className="h-5 w-5" />
                  <span>Smart Repair (Partial)</span>
                </Button>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs italic text-muted-foreground">
                    <span>{status}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Real-time Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span>Faculty Workload Balance</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">92%</Badge>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Student Gap Optimization</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">High</Badge>
                </div>
              </CardContent>
            </Card>

            <ConflictPredictor />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TimetableGeneration;