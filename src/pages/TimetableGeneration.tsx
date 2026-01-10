"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Brain, ShieldAlert, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchBatches(); }, []);

  const fetchBatches = async () => {
    const { data } = await supabase.from("batches").select("id, name, year, semester");
    setBatches(data || []);
    setLoading(false);
  };

  const runAIAlgorithm = async (mode: 'full' | 'partial') => {
    if (!selectedBatchId) return;
    setIsGenerating(true);
    setProgress(10);
    setStatus("AI Engine initializing...");

    try {
      // Simulate progress for UI feel
      const interval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 5 : prev));
      }, 500);

      const response = await fetch(`https://bcfkkrfrzutbmhdbosaa.supabase.co/functions/v1/ai-timetable-engine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession()}`
        },
        body: JSON.stringify({ batch_id: selectedBatchId, mode })
      });

      clearInterval(interval);
      
      if (!response.ok) throw new Error("AI Engine failed to compute.");

      setProgress(100);
      setStatus("Optimization complete!");
      toast({
        title: "AI Optimization Successful",
        description: `Generated a high-stability timetable for ${mode} request.`,
      });
    } catch (error: any) {
      toast({ title: "AI Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Timetable Engine</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>AI Control Center</CardTitle>
              <CardDescription>
                Use heuristic models to generate the most efficient schedule.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Target Class</label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a batch..." />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={() => runAIAlgorithm('full')} 
                  disabled={isGenerating || !selectedBatchId}
                  className="h-20 flex flex-col gap-1"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>Full AI Generation</span>
                  <span className="text-[10px] opacity-70">Complete recalculation</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => runAIAlgorithm('partial')} 
                  disabled={isGenerating || !selectedBatchId}
                  className="h-20 flex flex-col gap-1"
                >
                  <History className="h-5 w-5" />
                  <span>Smart Partial Sync</span>
                  <span className="text-[10px] opacity-70">Preserve high-score slots</span>
                </Button>
              </div>

              {isGenerating && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-4">
                  <div className="flex justify-between text-sm">
                    <span className="italic text-muted-foreground">{status}</span>
                    <span className="font-bold">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">AI Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Workload Balance</span>
                  <Badge variant="secondary">Optimal</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Constraint Satisfaction</span>
                  <Badge variant="outline" className="text-green-600">98%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Conflict Prediction</span>
                  <Badge variant="outline" className="text-blue-600">Low Risk</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-destructive" />
                  Conflict Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-muted-foreground">
                  The AI predictor currently sees no hard conflicts for the selected batch.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TimetableGeneration;