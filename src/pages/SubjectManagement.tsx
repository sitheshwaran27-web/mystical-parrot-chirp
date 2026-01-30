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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Trash2,
  Plus,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  Edit,
  Search,
  X
} from "lucide-react";
import * as XLSX from "xlsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "../hooks/use-debounce";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

interface Department {
  name: string;
}

const initialSubjectState = {
  id: "",
  name: "",
  type: "theory",
  department: "",
  section: "",
  class_name: "",
  year: "",
  semester: "",
};

const SubjectManagement = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [filters, setFilters] = useState({
    department: "all",
    type: "all",
    class_name: "all",
    year: "all",
    semester: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data, isLoading: isSubjectsLoading, refetch: refetchSubjects } = useQuery({
    queryKey: ['subjects', debouncedSearch, filters, currentPage],
    queryFn: async () => {
      let query = supabase
        .from("subjects")
        .select("*", { count: 'exact' });

      // Search
      if (debouncedSearch) {
        query = query.ilike("name", `%${debouncedSearch}%`);
      }

      // Filters
      if (filters.department !== "all") query = query.eq("department", filters.department);
      if (filters.type !== "all") query = query.eq("type", filters.type);
      if (filters.class_name !== "all") query = query.eq("class_name", filters.class_name);
      if (filters.year !== "all") query = query.eq("year", parseInt(filters.year));
      if (filters.semester !== "all") query = query.eq("semester", parseInt(filters.semester));

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { subjects: data as Subject[], total: count || 0 };
    }
  });

  const subjectList = data?.subjects || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const { data: departments = [], isLoading: isDepartmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("name");
      if (error) throw error;
      return data as Department[];
    }
  });

  const loading = isSubjectsLoading || isDepartmentsLoading;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(initialSubjectState);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      department: "all",
      type: "all",
      class_name: "all",
      year: "all",
      semester: "all",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  const fetchSubjects = async () => {
    await refetchSubjects();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCurrentSubject((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, id: keyof typeof initialSubjectState) => {
    setCurrentSubject((prev) => ({ ...prev, [id]: value }));
  };

  const handleEditSubject = (subject: Subject) => {
    setCurrentSubject({
      id: subject.id,
      name: subject.name,
      type: subject.type,
      department: subject.department || "",
      section: subject.section || "",
      class_name: subject.class_name || "",
      year: subject.year ? String(subject.year) : "",
      semester: subject.semester ? String(subject.semester) : "",
    });
    setIsDialogOpen(true);
  };

  const handleAddOrUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject.name || !currentSubject.type || !currentSubject.department) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: currentSubject.name,
      type: currentSubject.type,
      department: currentSubject.department,
      section: currentSubject.section || null,
      class_name: currentSubject.class_name || null,
      year: currentSubject.year ? parseInt(currentSubject.year) : null,
      semester: currentSubject.semester ? parseInt(currentSubject.semester) : null,
    };

    let error = null;

    if (currentSubject.id) {
      // Update existing subject
      const { error: updateError } = await supabase
        .from("subjects")
        .update(payload)
        .eq("id", currentSubject.id);
      error = updateError;
    } else {
      // Add new subject
      const { error: insertError } = await supabase.from("subjects").insert([payload]);
      error = insertError;
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
        description: currentSubject.id ? "Subject updated successfully." : "Subject added successfully.",
      });
      setCurrentSubject(initialSubjectState);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
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
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const { error } = await supabase.from("subjects").delete().in("id", selectedIds);
    if (error) {
      toast({
        title: "Bulk Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedIds.length} subjects.`,
      });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === subjectList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(subjectList.map(s => s.id));
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
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          throw new Error("The uploaded file is empty.");
        }

        // Map Excel columns to database columns with more flexibility
        const subjectsToInsert = json.map((row: any) => {
          const yearRaw = row.year || row.Year || row.YEAR;
          const semRaw = row.semester || row.Semester || row.SEMESTER;

          return {
            name: row.name || row.Name || row.NAME || "",
            type: (row.type || row.Type || row.TYPE || "theory").toLowerCase(),
            department: row.department || row.Department || row.DEPARTMENT || null,
            class_name: row.class_name || row.class || row.Class || row.CLASS || null,
            section: row.section || row.Section || row.SECTION || null,
            year: yearRaw ? parseInt(String(yearRaw)) : null,
            semester: semRaw ? parseInt(String(semRaw)) : null,
          };
        }).filter(s => s.name && s.type && s.department);

        if (subjectsToInsert.length === 0) {
          throw new Error("No valid subjects found. Ensure columns 'name', 'type', 'department', 'year', 'semester', 'class_name', and 'section' are used correctly.");
        }

        const { error } = await supabase.from("subjects").insert(subjectsToInsert);

        if (error) throw error;

        toast({
          title: "Bulk Upload Success",
          description: `Successfully uploaded ${subjectsToInsert.length} subjects.`,
        });
        queryClient.invalidateQueries({ queryKey: ['subjects'] });
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
        name: "Data Structures",
        type: "theory",
        department: "Computer Science",
        class_name: "FYBCA",
        section: "A",
        year: 2024,
        semester: 1
      },
      {
        name: "Java Programming Lab",
        type: "lab",
        department: "Computer Science",
        class_name: "SYBCA",
        section: "B",
        year: 2024,
        semester: 3
      }
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
          <div>
            <h1 className="text-3xl font-bold">Subject Management</h1>
            {selectedIds.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedIds.length} subjects selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchSubjects} disabled={loading}>
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
                  <DialogTitle>Bulk Upload Subjects</DialogTitle>
                  <DialogDescription>
                    Upload an Excel file (.xls, .xlsx) with subjects data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label>Instructions</Label>
                    <p className="text-sm text-muted-foreground">
                      Your Excel file <strong>must</strong> include: <strong>name, type, department, year, semester, class_name, section</strong>.
                    </p>
                    <Button variant="link" onClick={downloadTemplate} className="justify-start p-0 h-auto">
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Download Updated Template
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

            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setCurrentSubject(initialSubjectState); // Reset form on close
                }
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setCurrentSubject(initialSubjectState)}><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{currentSubject.id ? "Edit Subject" : "Add New Subject"}</DialogTitle>
                  <DialogDescription>
                    Enter the details for the subject.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddOrUpdateSubject} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={currentSubject.name} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select onValueChange={(v) => handleSelectChange(v, "type")} value={currentSubject.type}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="theory">Theory</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select onValueChange={(v) => handleSelectChange(v, "department")} value={currentSubject.department}>
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
                      <Input id="class_name" value={currentSubject.class_name} onChange={handleInputChange} placeholder="e.g. FYBCA" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="section">Section</Label>
                      <Input id="section" value={currentSubject.section} onChange={handleInputChange} placeholder="e.g. A" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="year">Year</Label>
                      <Input id="year" type="number" value={currentSubject.year} onChange={handleInputChange} placeholder="e.g. 2024" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Input id="semester" type="number" value={currentSubject.semester} onChange={handleInputChange} placeholder="e.g. 1" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full mt-4">
                    {currentSubject.id ? "Save Changes" : "Add Subject"}
                  </Button>
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
                placeholder="Search subject name..."
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
              <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (dept.name && <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[120px]">
            <Label className="mb-2 block">Type</Label>
            <Select value={filters.type} onValueChange={(v) => handleFilterChange("type", v)}>
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="theory">Theory</SelectItem>
                <SelectItem value="lab">Lab</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[100px]">
            <Label className="mb-2 block">Year</Label>
            <Select value={filters.year} onValueChange={(v) => handleFilterChange("year", v)}>
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {[2023, 2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[100px]">
            <Label className="mb-2 block">Sem</Label>
            <Select value={filters.semester} onValueChange={(v) => handleFilterChange("semester", v)}>
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
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
                      checked={subjectList.length > 0 && selectedIds.length === subjectList.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
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
                    <TableRow key={subject.id} className={selectedIds.includes(subject.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(subject.id)}
                          onCheckedChange={() => toggleSelectRow(subject.id)}
                        />
                      </TableCell>
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
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditSubject(subject)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
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

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min(totalCount, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(totalCount, currentPage * itemsPerPage)} of {totalCount} subjects
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

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
                    <PaginationItem><PaginationEllipsis /></PaginationItem>
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
    </DashboardLayout>
  );
};

export default SubjectManagement;