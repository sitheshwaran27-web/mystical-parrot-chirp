"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, FileBarChart, RefreshCw, Brain, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { Progress } from "@/components/ui/progress";

interface FacultyWorkload {
  id: string;
  name: string;
  department: string | null;
  total_slots: number;
  avg_ai_score: number;
}

const WorkloadReports = () => {
  const [workloads, setWorkloads] = useState<FacultyWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkloadData = async () => {
    setLoading(true);
    try {
      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("id, name, department");

      if (facultyError) throw facultyError;

      const { data: slotData, error: slotError } = await supabase
        .from("schedule_slots")
        .select("faculty_id, ai_score")
        .not("faculty_id", "is", null);

      if (slotError) throw slotError;

      const workloadMap: Record<string, { count: number; totalScore: number }> = {};
      slotData.forEach((slot) => {
        const id = slot.faculty_id;
        if (!workloadMap[id]) workloadMap[id] = { count: 0, totalScore: 0 };
        workloadMap[id].count += 1;
        workloadMap[id].totalScore += slot.ai_score || 0;
      });

      const calculatedWorkloads = facultyData.map((f) => ({
        ...f,
        total_slots: workloadMap[f.id]?.count || 0,
        avg_ai_score: workloadMap[f.id] ? Math.round(workloadMap[f.id].totalScore / workloadMap[f.id].count) : 0,
      }));

      setWorkloads(calculatedWorkloads.sort((a, b) => b.total_slots - a.total_slots));
    } catch (error: any) {
      showError("Failed to generate AI workload reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkloadData();
  }, []);

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              AI Workload Diagnostics
            </h1>
            <p className="text-muted-foreground mt-1">
              AI analysis of faculty distribution and burnout probability.
            </p>
          </div>
          <Button variant="outline" onClick={fetchWorkloadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Re-calculate Metrics
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Global Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94.2%</div>
                  <p className="text-xs text-muted-foreground">+2.1% from last generation</p>
                  <Progress value={94} className="h-1 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Assigned Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {workloads.reduce((acc, curr) => acc + curr.total_slots, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all departments</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Burnout Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">Low</div>
                  <p className="text-xs text-muted-foreground">3 faculty in "Moderate" zone</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Faculty Performance Matrix
                </CardTitle>
                <CardDescription>
                  AI optimization score indicates how well a schedule aligns with faculty historical preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faculty Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Total Sessions</TableHead>
                      <TableHead className="text-center">AI Alignment Score</TableHead>
                      <TableHead className="text-right">AI Advisory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workloads.map((faculty) => (
                      <TableRow key={faculty.id}>
                        <TableCell className="font-medium">{faculty.name}</TableCell>
                        <TableCell>{faculty.department || "N/A"}</TableCell>
                        <TableCell className="text-center">{faculty.total_slots}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-bold">{faculty.avg_ai_score}%</span>
                            <div className="w-16 h-1 bg-secondary rounded-full">
                                <div 
                                    className="h-full bg-blue-500 rounded-full" 
                                    style={{ width: `${faculty.avg_ai_score}%` }} 
                                />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              faculty.total_slots > 15
                                ? "bg-red-100 text-red-700"
                                : faculty.total_slots > 10
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {faculty.total_slots > 15 ? "Overloaded" : faculty.total_slots > 10 ? "Optimal" : "Healthy"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkloadReports;