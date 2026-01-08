"use client";

import React, { useEffect, useState, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, Upload, FileSpreadsheet, RefreshCw, Edit, Plus } from "lucide-react";
import * as XLSX from "xlsx";

interface Department {
  id: string;
  name: string;
  code: string;
}

const initialDeptState = { id: "", name: "", code: "" };

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [currentDept, setCurrentDept] = useState(initialDeptState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchDepartments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch departments.", variant: "destructive" });
    } else {
      setDepartments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCurrentDept((prev) => ({ ...prev, [id]: value }));
  };

  const handleEditDept = (dept: Department) => {
    setCurrentDept({ id: dept.id, name: dept.name, code: dept.code });
    setIsDialogOpen(true);
  };

  const handleAddOrUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDept.name || !currentDept.code) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }

    const payload = { name: currentDept.name, code: currentDept.code };
    let error = null;

    if (currentDept.id) {
      const { error: updateError } = await supabase.from("departments").update(payload).eq("id", currentDept.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("departments").insert([payload]);
      error = insertError;
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: currentDept.id ? "Department updated." : "Department added." });
      setCurrentDept(initialDeptState);
      setIsDialogOpen(false);
      fetchDepartments();
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Department removed." });
      fetchDepartments();
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        const depts = json.map((row: any) => ({
          name: row.name || row.Name || "",
          code: row.code || row.Code || "",
        })).filter(d => d.name && d.code);
        const { error } = await supabase.from("departments").insert(depts);
        if (error) throw error;
        toast({ title: "Success", description: `Uploaded ${depts.length} departments.` });
        fetchDepartments();
      } catch (error: any) {
        toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Department Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchDepartments} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setCurrentDept(initialDeptState); }}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Department</Button></DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{currentDept.id ? "Edit Department" : "Add New Department"}</DialogTitle>
                  <DialogDescription>Enter department details.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddOrUpdateDept} className="grid gap-4 py-4">
                  <div className="grid gap-2"><Label htmlFor="name">Name</Label><Input id="name" value={currentDept.name} onChange={handleInputChange} required /></div>
                  <div className="grid gap-2"><Label htmlFor="code">Code</Label><Input id="code" value={currentDept.code} onChange={handleInputChange} required /></div>
                  <Button type="submit" className="w-full mt-4">{currentDept.id ? "Save Changes" : "Add Department"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div> : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell>{dept.code}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditDept(dept)}><Edit className="h-4 w-4 text-blue-500" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDepartment(dept.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DepartmentManagement;