"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, RefreshCw, Plus } from "lucide-react";
import { Link } from "react-router-dom";

interface Batch {
  id: string;
  name: string;
  department_id: string | null;
  year: number;
  semester: number;
  departments?: { name: string } | null;
}

interface Department {
  id: string;
  name: string;
}

const BatchManagement = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingDepts, setFetchingDepts] = useState(false);
  const [newBatch, setNewBatch] = useState({
    name: "",
    department_id: "",
    year: new Date().getFullYear(),
    semester: 1,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchDepartments = useCallback(async () => {
    setFetchingDepts(true);
    const { data, error } = await supabase.from("departments").select("id, name").order("name");
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load departments.",
        variant: "destructive",
      });
    } else {
      setDepartments(data || []);
    }
    setFetchingDepts(false);
  }, [toast]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await fetchDepartments();

    const { data: batchData, error } = await supabase
      .from("batches")
      .select(`
        id, 
        name, 
        department_id, 
        year, 
        semester,
        departments (name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch batches.",
        variant: "destructive",
      });
    } else {
      setBatches(batchData as any || []);
    }
    setLoading(false);
  }, [fetchDepartments, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewBatch((prev) => ({
      ...prev,
      [id]: id === "year" || id === "semester" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setNewBatch((prev) => ({ ...prev, department_id: value }));
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name || !newBatch.department_id || newBatch.year <= 0 || newBatch.semester <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields correctly.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("batches").insert([
      {
        name: newBatch.name,
        department_id: newBatch.department_id,
        year: newBatch.year,
        semester: newBatch.semester,
      },
    ]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Batch added successfully.",
      });
      setIsDialogOpen(false);
      setNewBatch({ name: "", department_id: "", year: new Date().getFullYear(), semester: 1 });
      fetchData();
    }
  };

  const handleDeleteBatch = async (id: string) => {
    const { error } = await supabase.from("batches").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Deleted", description: "Batch removed." });
      fetchData();
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Batch Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Batch</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Batch</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new batch.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddBatch} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Batch Name (e.g., CSE-2024-A)</Label>
                    <Input
                      id="name"
                      value={newBatch.name}
                      onChange={handleInputChange}
                      placeholder="Enter batch name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="department">Department</Label>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-xs" 
                        onClick={fetchDepartments}
                        type="button"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${fetchingDepts ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>
                    <Select
                      onValueChange={handleSelectChange}
                      value={newBatch.department_id || undefined}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={fetchingDepts ? "Loading..." : "Select department"} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.length === 0 ? (
                          <div className="p-2 text-center">
                            <p className="text-sm text-muted-foreground mb-2">No departments found.</p>
                            <Button asChild variant="outline" size="sm" className="w-full">
                              <Link to="/dashboard/departments">
                                <Plus className="h-3 w-3 mr-1" /> Add Department
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="year">Admission Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={newBatch.year}
                        onChange={handleInputChange}
                        required
                        min="2000"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="semester">Current Semester</Label>
                      <Input
                        id="semester"
                        type="number"
                        value={newBatch.semester}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-4" disabled={departments.length === 0}>
                    Add Batch
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No batches found. Click "Add Batch" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.name}</TableCell>
                      <TableCell>{batch.departments?.name || "N/A"}</TableCell>
                      <TableCell>{batch.year}</TableCell>
                      <TableCell>{batch.semester}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteBatch(batch.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BatchManagement;