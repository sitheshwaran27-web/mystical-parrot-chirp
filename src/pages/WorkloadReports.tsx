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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileBarChart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";

interface FacultyWorkload {
  id: string;
  name: string;
  department: string | null;
  total_slots: number;
}

const WorkloadReports = () => {
  const [workloads, setWorkloads] = useState<FacultyWorkload[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkloadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all faculty
      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("id, name, department");

      if (facultyError) throw facultyError;

      // 2. Fetch all schedule slots to count assignments
      const { data: slotData, error: slotError } = await supabase
        .from("schedule_slots")
        .select("faculty_id")
        .not("faculty_id", "is", null);

      if (slotError) throw slotError;

      // 3. Calculate workloads
      const workloadMap: Record<string, number> = {};
      slotData.forEach((slot) => {
        const id = slot.faculty_id;
        workloadMap[id] = (workloadMap[id] || 0) + 1;
      });

      const calculatedWorkloads = facultyData.map((f) => ({
        ...f,
        total_slots: workloadMap[f.id] || 0,
      }));

      // Sort by workload (highest first)
      setWorkloads(calculatedWorkloads.sort((a, b) => b.total_slots - a.total_slots));
    } catch (error: any) {
      console.error("Error fetching workload:", error);
      showError("Failed to generate workload reports.");
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
            <h1 className="text-3xl font-bold">Workload Reports</h1>
            <p className="text-muted-foreground mt-1">
              Review the total number of sessions assigned to each faculty member.
            </p>
          </div>
          <Button variant="outline" onClick={fetchWorkloadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5" />
                  Faculty Session Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Faculty Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Total Sessions (Hours)</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workloads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          No faculty data found to report.
                        </TableCell>
                      </TableRow>
                    ) : (
                      workloads.map((faculty) => (
                        <TableRow key={faculty.id}>
                          <TableCell className="font-medium">{faculty.name}</TableCell>
                          <TableCell>{faculty.department || "N/A"}</TableCell>
                          <TableCell className="text-center font-bold">
                            {faculty.total_slots}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                faculty.total_slots > 15
                                  ? "bg-red-100 text-red-700"
                                  : faculty.total_slots > 10
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {faculty.total_slots > 15 ? "Overloaded" : faculty.total_slots > 10 ? "Moderate" : "Underloaded"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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