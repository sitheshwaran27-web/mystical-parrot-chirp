"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { Loader2, Trash2, Plus, RefreshCw, Upload, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

interface Subject {
  id: string;
  name: string;
  type: string;
  department: string | null;
  section: string | null;
  class_name: string | null;
  year: number | null;
  semester: number | null;
}

const SubjectManagement = () => {
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newSubject, setNewSubject] = useState({
    name: "",
    type: "theory",
    department: "",
    section: "",
    class_name: "",
    year: "",
    semester: "",
  });
  const { toast } = useToast();

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch subjects.",
        variant: "destructive",
      });
    } else {
      setSubjectList(data || []);
    }
    setLoading(false);
  }, [toast]);

  const fetchDepartments = useCallback(async () => {
    const { data } = await supabase.from("departments").select("name");
    if (data) setDepartments(data);
  }, []);

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
  }, [fetchSubjects, fetchDepartments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewSubject((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, id: string) => {
    setNewSubject((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name || !newSubject.type || !newSubject.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("subjects").insert([
      {
        name: newSubject.name,
        type: newSubject.type,
        department: newSubject.department,
        section: newSubject.section,
        class_name: newSubject.class_name,
        year: newSubject.year ? parseInt(newSubject.year) : null,
        semester: newSubject.semester ? parseInt(newSubject.semester) : null,
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
        description: "Subject added successfully.",
      });
      setNewSubject({ 
        name: "", 
        type: "theory", 
        department: "", 
        section: "", 
        class_name: "",
        year: "",
        semester: "",
      });
      setIsDialogOpen(false);
      fetchSubjects();
    }
  };

  const handleDeleteSubject = async (id: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Deleted", description: "Subject removed." });
      fetchSubjects();
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
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          throw new Error("The uploaded file is empty.");
        }

        // Map Excel columns to database columns
        const subjectsToInsert = json.map((row: any) => ({
          name: row.name || row.Name || "",
          type: (row.type || row.Type || "theory").toLowerCase(),
          department: row.department || row.Department || null,
          class_name: row.class_name || row.Class || null,
          section: row.section || row.Section || null,
          year: row.year || row.Year ? parseInt(row.year || row.Year) : null,
          semester: row.semester || row.Semester ? parseInt(row.semester || row.Semester) : null,
        })).filter(s => s.name && s.type && s.department);

        if (subjectsToInsert.length === 0) {
          throw new Error("No valid subjects found. Ensure columns 'name', 'type', and 'department' are present.");
        }

        const { error } = await supabase.from("subjects").insert(subjectsToInsert);

        if (error) throw error;

        toast({
          title: "Bulk Upload Success",
          description: `Successfully uploaded ${subjectsToInsert.length} subjects.`,
        });
        fetchSubjects();
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const template = [
      { name: "Subject Name", type: "theory", department: "Computer Science", class_name: "FYBCA", section: "A", year: 2024, semester: 1 }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Subject_Upload_Template.xlsx");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Subject Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchSubjects} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Upload Subjects</DialogTitle>
                  <DialogDescription>
                    Upload an Excel file (.xls, .xlsx) with subjects data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label>Instructions</Label>
                    <p className="text-sm text-muted-foreground">
                      Ensure your file has the following columns: <strong>name, type, department</strong>. 
                      Optional: class_name, section, year, semester.
                    </p>
                    <Button variant="link" onClick={downloadTemplate} className="justify-start p-0 h-auto">
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Template
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bulk-file">Choose File</Label>
                    <Input 
                      id="bulk-file" 
                      type="file" 
                      accept=".xls,.xlsx" 
                      onChange={handleBulkUpload} 
                      disabled={isUploading}
                      ref={fileInputRef}
                    />
                  </div>
                  {isUploading && (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new subject.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddSubject} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={newSubject.name} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select onValueChange={(v) => handleSelectChange(v, "type")} value={newSubject.type}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="theory">Theory</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select onValueChange={(v) => handleSelectChange(v, "department")} value={newSubject.department}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="class_name">Class</Label>
                      <Input id="class_name" value={newSubject.class_name} onChange={handleInputChange} placeholder="e.g. FYBCA" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="section">Section</Label>
                      <Input id="section" value={newSubject.section} onChange={handleInputChange} placeholder="e.g. A" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="year">Year</Label>
                      <Input id="year" type="number" value={newSubject.year} onChange={handleInputChange} placeholder="e.g. 2024" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Input id="semester" type="number" value={newSubject.semester} onChange={handleInputChange} placeholder="e.g. 1" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-4">Add Subject</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Dept / Class / Sec</TableHead>
                  <TableHead>Year / Sem</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No subjects found.</TableCell>
                  </TableRow>
                ) : (
                  subjectList.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {subject.department || "-"} / {subject.class_name || "-"} / {subject.section || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {subject.year || "-"} / {subject.semester || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize">{subject.type}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject.id)}>
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

export default SubjectManagement;