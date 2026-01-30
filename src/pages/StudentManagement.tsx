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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  X,
  Loader2,
  Trash2,
  Upload,
  FileSpreadsheet,
  RefreshCw,
  Edit,
  Plus,
  GraduationCap
} from "lucide-react";
import * as XLSX from "xlsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "../hooks/use-debounce";

interface Student {
  id: string;
  name: string;
  email: string;
  department: string | null;
  current_year: number;
  current_semester: number;
  section: string | null;
  class_name: string | null;
  password?: string;
}

interface ExcelStudentRow {
  name?: string;
  Name?: string;
  email?: string;
  Email?: string;
  department?: string;
  Department?: string;
  current_year?: number;
  Year?: number;
  current_semester?: number;
  Semester?: number;
  section?: string;
  Section?: string;
  class_name?: string;
  Class?: string;
  Batch?: string;
}

const initialStudentState = {
  id: "",
  name: "",
  email: "",
  department: "",
  current_year: new Date().getFullYear(),
  current_semester: 1,
  section: "",
  class_name: "",
  password: "",
};

const StudentManagement = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isUploading, setIsUploading] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(initialStudentState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk Upload Preview State
  const [previewData, setPreviewData] = useState<Omit<Student, "id">[]>([]);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // Filtering and Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [filters, setFilters] = useState({
    department: "all",
    year: "all",
    semester: "all",
    section: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data, isLoading: isStudentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ['students', debouncedSearch, filters, currentPage],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select("*", { count: 'exact' });

      // Search
      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }

      // Filters
      if (filters.department !== "all") {
        query = query.eq("department", filters.department);
      }
      if (filters.year !== "all") {
        query = query.eq("current_year", parseInt(filters.year));
      }
      if (filters.semester !== "all") {
        query = query.eq("current_semester", parseInt(filters.semester));
      }
      if (filters.section !== "all") {
        query = query.eq("section", filters.section);
      }

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { students: data as Student[], total: count || 0 };
    }
  });

  const studentList = data?.students || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const { data: departments = [], isLoading: isDepartmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("name");
      if (error) throw error;
      return data as { name: string }[];
    }
  });

  const { data: batchOptions = [], isLoading: isBatchesLoading } = useQuery({
    queryKey: ['batches', 'names'],
    queryFn: async () => {
      const { data, error } = await supabase.from("batches").select("name");
      if (error) throw error;
      return data as { name: string }[];
    }
  });

  const loading = isStudentsLoading || isDepartmentsLoading || isBatchesLoading;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      department: "all",
      year: "all",
      semester: "all",
      section: "all",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Manual fetch calls are now replaced by useQuery
  const fetchStudents = async () => {
    await refetchStudents();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCurrentStudent((prev) => ({
      ...prev,
      [id]: id === "current_year" || id === "current_semester" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSelectChange = (value: string, id: string) => {
    setCurrentStudent((prev) => ({ ...prev, [id]: value }));
  };

  const handleEditStudent = (student: Student) => {
    setCurrentStudent({
      id: student.id,
      name: student.name,
      email: student.email,
      department: student.department || "",
      current_year: student.current_year,
      current_semester: student.current_semester,
      section: student.section || "",
      class_name: student.class_name || "",
      password: "", // Don't pre-fill password for security
    });
    setIsDialogOpen(true);
  };

  const handleAddOrUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent.name || !currentStudent.email || !currentStudent.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: currentStudent.name,
      email: currentStudent.email,
      department: currentStudent.department,
      current_year: currentStudent.current_year,
      current_semester: currentStudent.current_semester,
      section: currentStudent.section,
      class_name: currentStudent.class_name,
    };

    let error = null;
    if (currentStudent.id) {
      // 1. Update the Student Table data
      const { error: updateError } = await supabase
        .from("students")
        .update(payload)
        .eq("id", currentStudent.id);

      error = updateError;

      // Sync class_name to profiles table if update was successful
      if (!error) {
        await supabase
          .from("profiles")
          .update({ class_name: payload.class_name })
          .eq("id", currentStudent.id);
      }

      if (!error && currentStudent.password) {
        // 2. Sync with Auth via Edge Function
        // Try updating first
        const { data, error: functionError } = await supabase.functions.invoke('manage-users', {
          body: {
            action: 'update',
            userId: currentStudent.id,
            email: currentStudent.email,
            password: currentStudent.password,
            role: 'student',
            userData: payload
          }
        });

        if (functionError || !data?.success) {
          console.log("Update failed, attempting to create login for existing record (bulk upload case)");
          // If update failed (e.g. user not in Auth), try to CREATE
          const { data: createData, error: createFunctionError } = await supabase.functions.invoke('manage-users', {
            body: {
              action: 'create',
              email: currentStudent.email,
              password: currentStudent.password,
              role: 'student',
              userData: payload
            }
          });

          if (!createFunctionError && createData?.success) {
            const newId = createData.userId;
            const oldId = currentStudent.id;

            // 1. Update the record's ID to match the new Auth ID
            // Any foreign keys with CASCADE will follow.
            const { error: idUpdateError } = await supabase
              .from("students")
              .update({ id: newId })
              .eq("id", oldId);

            if (idUpdateError) {
              console.error("Failed to sync record ID:", idUpdateError);
              error = new Error("Auth account created, but failed to link to student record.");
            } else {
              // 2. Explicitly update potential dependent tables here if needed in the future
              // e.g., await supabase.from("attendance").update({ student_id: newId }).eq("student_id", oldId);
            }
          } else {
            error = createFunctionError || new Error(createData?.error || "Failed to create login");
          }
        }
      }
    } else {
      // For new students, create Auth user first via Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          email: currentStudent.email,
          password: currentStudent.password,
          role: 'student',
          userData: {
            name: currentStudent.name,
            class_name: `${currentStudent.department} Year ${currentStudent.current_year}`,
            ...payload
          }
        }
      });

      if (functionError || (data && !data.success)) {
        console.warn('Edge Function failed, falling back to direct database insertion', functionError || data?.error);

        // Fallback: Create the student record directly in the database
        // This allows the admin to continue managing data even if Auth fails
        const { error: insertError } = await supabase
          .from("students")
          .insert([payload]);

        if (insertError) {
          error = insertError;
        } else {
          toast({
            title: "Student Profile Created (Offline Mode)",
            description: "The student record was created, but the login account could not be set up automatically. You may need to create it manually later.",
            variant: "default",
          });
          // Reset error so we don't show the red error toast below
          error = null;
        }
      } else {
        // Now insert into the students table using the same ID from Auth
        const { error: insertError } = await supabase
          .from("students")
          .insert([{ ...payload, id: data.userId }]);
        error = insertError;
      }
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: currentStudent.id ? "Student updated." : "Student added.",
      });
      setIsDialogOpen(false);
      setCurrentStudent(initialStudentState);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Deleted", description: "Student removed." });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const { error } = await supabase.from("students").delete().in("id", selectedIds);
    if (error) {
      toast({
        title: "Bulk Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedIds.length} students.`,
      });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === studentList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(studentList.map(s => s.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
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
        const json = XLSX.utils.sheet_to_json<ExcelStudentRow>(worksheet);

        if (json.length === 0) throw new Error("File is empty.");

        const studentsToInsert = json.map((row) => ({
          name: row.name || row.Name || "",
          email: row.email || row.Email || "",
          department: row.department || row.Department || null,
          current_year: row.current_year ? Number(row.current_year) : (row.Year ? Number(row.Year) : 1),
          current_semester: row.current_semester ? Number(row.current_semester) : (row.Semester ? Number(row.Semester) : 1),
          section: row.section || row.Section || null,
          class_name: row.class_name || row.Class || row.Batch || null,
        })).filter(s => s.name || s.email);

        if (studentsToInsert.length === 0) throw new Error("No valid student data found.");

        setPreviewData(studentsToInsert);
        setIsPreviewDialogOpen(true);
      } catch (error: unknown) {
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handlePreviewCellEdit = (index: number, field: keyof Omit<Student, "id">, value: string | number) => {
    const newData = [...previewData];
    newData[index] = { ...newData[index], [field]: value } as Omit<Student, "id">;
    setPreviewData(newData);
  };

  const handleRemovePreviewRow = (index: number) => {
    const newData = [...previewData];
    newData.splice(index, 1);
    setPreviewData(newData);
    if (newData.length === 0) {
      setIsPreviewDialogOpen(false);
    }
  };

  const confirmBulkUpload = async () => {
    try {
      setIsUploading(true);
      const { error } = await supabase.from("students").insert(previewData);
      if (error) throw error;

      toast({
        title: "Bulk Upload Success",
        description: `Successfully uploaded ${previewData.length} students.`,
      });
      setIsPreviewDialogOpen(false);
      setPreviewData([]);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (error: unknown) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      { name: "John Doe", email: "john@example.com", department: "Computer Science", current_year: 1, current_semester: 1, section: "A" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Student_Template.xlsx");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Student Management</h1>
            {selectedIds.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedIds.length} students selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetchStudents()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>

            {selectedIds.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
              </Button>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Upload Students</DialogTitle>
                  <DialogDescription>Upload an Excel file with student details.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Button variant="link" onClick={downloadTemplate} className="p-0 h-auto">
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Template
                  </Button>
                  <Input type="file" accept=".xls,.xlsx" onChange={handleBulkUpload} disabled={isUploading} ref={fileInputRef} />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
              <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Review Student Data</DialogTitle>
                  <DialogDescription>
                    Edit the data below if needed before confirming the upload.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-auto py-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Sem</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Batch/Class</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="p-2">
                            <Input
                              value={row.name}
                              onChange={(e) => handlePreviewCellEdit(index, "name", e.target.value)}
                              className="h-8 py-1"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              value={row.email}
                              onChange={(e) => handlePreviewCellEdit(index, "email", e.target.value)}
                              className="h-8 py-1"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              value={row.department || ""}
                              onChange={(e) => handlePreviewCellEdit(index, "department", e.target.value)}
                              className="h-8 py-1"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              value={row.current_year || ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                handlePreviewCellEdit(index, "current_year", isNaN(val) ? 0 : val);
                              }}
                              className="h-8 py-1"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              value={row.current_semester || ""}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                handlePreviewCellEdit(index, "current_semester", isNaN(val) ? 0 : val);
                              }}
                              className="h-8 py-1"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              value={row.section || ""}
                              onChange={(e) => handlePreviewCellEdit(index, "section", e.target.value)}
                              className="h-8 py-1"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={row.class_name || ""}
                              onValueChange={(v) => handlePreviewCellEdit(index, "class_name", v)}
                            >
                              <SelectTrigger className="h-8 py-1">
                                <SelectValue placeholder="Assign Batch" />
                              </SelectTrigger>
                              <SelectContent>
                                {batchOptions.map((b) => (
                                  <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemovePreviewRow(index)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>Cancel</Button>
                  <Button onClick={confirmBulkUpload} disabled={isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirm Upload
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setCurrentStudent(initialStudentState); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{currentStudent.id ? "Edit Student" : "Add New Student"}</DialogTitle>
                  <DialogDescription>Enter the details for the student.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddOrUpdateStudent} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={currentStudent.name} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={currentStudent.email} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password {currentStudent.id && "(Leave blank to keep current)"}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={currentStudent.password}
                      onChange={handleInputChange}
                      required={!currentStudent.id}
                      minLength={6}
                      placeholder="Min. 6 characters"
                    />
                    <p className="text-[10px] text-muted-foreground">Login requires at least 6 characters.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select onValueChange={(v) => handleSelectChange(v, "department")} value={currentStudent.department}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="class_name">Assigned Batch (For Timetable)</Label>
                    <Select onValueChange={(v) => handleSelectChange(v, "class_name")} value={currentStudent.class_name || ""}>
                      <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                      <SelectContent>
                        {batchOptions.map((batch) => (
                          <SelectItem key={batch.name} value={batch.name}>{batch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current_year">Year</Label>
                      <Input id="current_year" type="number" value={currentStudent.current_year} onChange={handleInputChange} min="1" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="current_semester">Semester</Label>
                      <Input id="current_semester" type="number" value={currentStudent.current_semester} onChange={handleInputChange} min="1" max="10" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="section">Section</Label>
                    <Input id="section" value={currentStudent.section} onChange={handleInputChange} placeholder="e.g. A" />
                  </div>
                  <Button type="submit" className="w-full mt-4">{currentStudent.id ? "Save Changes" : "Add Student"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-card border rounded-lg p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="search" className="mb-2 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="w-[180px]">
            <Label className="mb-2 block">Department</Label>
            <Select value={filters.department} onValueChange={(v) => handleFilterChange("department", v)}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[100px]">
            <Label className="mb-2 block">Year</Label>
            <Select value={filters.year} onValueChange={(v) => handleFilterChange("year", v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {[1, 2, 3, 4, 5].map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[100px]">
            <Label className="mb-2 block">Semester</Label>
            <Select value={filters.semester} onValueChange={(v) => handleFilterChange("semester", v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                  <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[100px]">
            <Label className="mb-2 block">Section</Label>
            <Select value={filters.section} onValueChange={(v) => handleFilterChange("section", v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {["A", "B", "C", "D", "E"].map((sec) => (
                  <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
            Clear Filters
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={studentList.length > 0 && selectedIds.length === studentList.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Sem</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Assigned Class</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentList.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">No students found.</TableCell></TableRow>
                ) : (
                  studentList.map((student) => (
                    <TableRow key={student.id} className={selectedIds.includes(student.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(student.id)}
                          onCheckedChange={() => toggleSelectRow(student.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell>{student.current_year}</TableCell>
                      <TableCell>{student.current_semester}</TableCell>
                      <TableCell>{student.section || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                          {student.class_name || "Unassigned"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(student.id)}>
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

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min(totalCount, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(totalCount, currentPage * itemsPerPage)} of {totalCount} students
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {/* Basic page numbers - could be improved with ellipsis for many pages */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </DashboardLayout >
  );
};

export default StudentManagement;
