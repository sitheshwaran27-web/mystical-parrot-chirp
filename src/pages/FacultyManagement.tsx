"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Loader2, Trash2, Upload, FileSpreadsheet, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";

interface Faculty {
  id: string;
  name: string;
  email: string | null;
  priority: string;
  department: string | null;
  designation: string | null;
}

const FacultyManagement = () => {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: "",
    email: "",
    priority: "junior",
    department: "",
    designation: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchFaculty = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("faculty")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch faculty list.",
        variant: "destructive",
      });
    } else {
      setFacultyList(data || []);
    }
    setLoading(false);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from("departments").select("name");
    if (data) setDepartments(data);
  };

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewFaculty((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, id: string) => {
    setNewFaculty((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaculty.name || !newFaculty.email || !newFaculty.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("faculty").insert([
      {
        name: newFaculty.name,
        email: newFaculty.email,
        priority: newFaculty.priority,
        department: newFaculty.department,
        designation: newFaculty.designation,
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
        description: "Faculty member added successfully.",
      });
      setIsDialogOpen(false);
      setNewFaculty({ name: "", email: "", priority: "junior", department: "", designation: "" });
      fetchFaculty();
    }
  };

  const handleDeleteFaculty = async (id: string) => {
    const { error } = await supabase.from("faculty").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Deleted", description: "Faculty removed." });
      fetchFaculty();
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

        const facultyToInsert = json.map((row: any) => ({
          name: row.name || row.Name || row.NAME || "",
          email: row.email || row.Email || row.EMAIL || "",
          priority: (row.priority || row.Priority || row.PRIORITY || "junior").toLowerCase(),
          department: row.department || row.Department || row.DEPARTMENT || null,
          designation: row.designation || row.Designation || row.DESIGNATION || null,
        })).filter(f => f.name && f.email);

        if (facultyToInsert.length === 0) {
          throw new Error("No valid faculty data found. Ensure 'name' and 'email' columns are present.");
        }

        const { error } = await supabase.from("faculty").insert(facultyToInsert);

        if (error) throw error;

        toast({
          title: "Bulk Upload Success",
          description: `Successfully uploaded ${facultyToInsert.length} faculty members.`,
        });
        fetchFaculty();
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
      { 
        name: "John Doe", 
        email: "john@example.com", 
        priority: "senior", 
        department: "Computer Science", 
        designation: "Professor" 
      },
      { 
        name: "Jane Smith", 
        email: "jane@example.com", 
        priority: "junior", 
        department: "Mathematics", 
        designation: "Assistant Professor" 
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculty Template");
    XLSX.writeFile(wb, "Faculty_Upload_Template.xlsx");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Faculty Management</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchFaculty} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Upload Faculty</DialogTitle>
                  <DialogDescription>
                    Upload an Excel file (.xls, .xlsx) with faculty details.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label>Instructions</Label>
                    <p className="text-sm text-muted-foreground">
                      Columns: <strong>name, email, priority (senior/junior), department, designation</strong>.
                    </p>
                    <Button variant="link" onClick={downloadTemplate} className="justify-start p-0 h-auto">
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Template
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bulk-file-faculty">Choose File</Label>
                    <Input 
                      id="bulk-file-faculty" 
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
                <Button>Add Faculty</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Faculty</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new faculty member.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddFaculty} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={newFaculty.name} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={newFaculty.email} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input id="designation" value={newFaculty.designation} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select onValueChange={(v) => handleSelectChange(v, "priority")} value={newFaculty.priority}>
                      <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select onValueChange={(v) => handleSelectChange(v, "department")} value={newFaculty.department}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full mt-4">Add Faculty</Button>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facultyList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No faculty found.</TableCell>
                  </TableRow>
                ) : (
                  facultyList.map((faculty) => (
                    <TableRow key={faculty.id}>
                      <TableCell className="font-medium">
                        {faculty.name}
                        {faculty.designation && <p className="text-xs text-muted-foreground font-normal">{faculty.designation}</p>}
                      </TableCell>
                      <TableCell>{faculty.email}</TableCell>
                      <TableCell className="capitalize">{faculty.priority}</TableCell>
                      <TableCell>{faculty.department}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteFaculty(faculty.id)}>
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

export default FacultyManagement;