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
  Plus
} from "lucide-react";
import * as XLSX from "xlsx";
import { useDebounce } from "../hooks/use-debounce";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Faculty {
  id: string;
  name: string;
  email: string | null;
  priority: string;
  department: string | null;
  designation: string | null;
  password?: string;
}

interface ExcelFacultyRow {
  name?: string;
  Name?: string;
  NAME?: string;
  email?: string;
  Email?: string;
  EMAIL?: string;
  priority?: string;
  Priority?: string;
  PRIORITY?: string;
  department?: string;
  Department?: string;
  DEPARTMENT?: string;
  designation?: string;
  Designation?: string;
  DESIGNATION?: string;
}

const initialFacultyState = {
  id: "",
  name: "",
  email: "",
  priority: "junior",
  department: "",
  designation: "",
  password: "",
};

const FacultyManagement = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [isUploading, setIsUploading] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState(initialFacultyState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk Upload Preview State
  const [previewData, setPreviewData] = useState<Omit<Faculty, "id">[]>([]);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // Filtering and Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [filters, setFilters] = useState({
    department: "all",
    priority: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data, isLoading: isFacultyLoading, refetch: refetchFaculty } = useQuery({
    queryKey: ['faculty', debouncedSearch, filters, currentPage],
    queryFn: async () => {
      let query = supabase
        .from("faculty")
        .select("*", { count: 'exact' });

      // Search
      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }

      // Filters
      if (filters.department !== "all") {
        query = query.eq("department", filters.department);
      }
      if (filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { faculty: data as Faculty[], total: count || 0 };
    }
  });

  const facultyList = data?.faculty || [];
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

  const loading = isFacultyLoading || isDepartmentsLoading;

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      department: "all",
      priority: "all",
    });
    setSearchQuery("");
    setCurrentPage(1);
  };


  const fetchFaculty = async () => {
    await refetchFaculty();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCurrentFaculty((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, id: string) => {
    setCurrentFaculty((prev) => ({ ...prev, [id]: value }));
  };

  const handleEditFaculty = (faculty: Faculty) => {
    setCurrentFaculty({
      id: faculty.id,
      name: faculty.name,
      email: faculty.email || "",
      priority: faculty.priority,
      department: faculty.department || "",
      designation: faculty.designation || "",
      password: "", // Don't pre-fill password
    });
    setIsDialogOpen(true);
  };

  const handleAddOrUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFaculty.name || !currentFaculty.email || !currentFaculty.department) {
      toast({
        title: "Error",
        description: "Please fill in Name, Email, and Department (required fields).",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: currentFaculty.name,
      email: currentFaculty.email,
      priority: currentFaculty.priority,
      department: currentFaculty.department,
      designation: currentFaculty.designation,
    };

    let error = null;
    if (currentFaculty.id) {
      // 1. Update the Faculty Table data
      const { error: updateError } = await supabase
        .from("faculty")
        .update(payload)
        .eq("id", currentFaculty.id);

      error = updateError;

      if (!error && currentFaculty.password) {
        // 2. Sync with Auth via Edge Function (with fallback)
        try {
          const { data, error: functionError } = await supabase.functions.invoke('manage-users', {
            body: {
              action: 'update',
              userId: currentFaculty.id,
              email: currentFaculty.email,
              password: currentFaculty.password,
              role: 'faculty',
              userData: payload
            }
          });

          if (functionError) {
            console.warn('Edge Function not available for update:', functionError);
            toast({
              title: "Partial Success",
              description: "Faculty updated, but password could not be changed. Edge Function not available.",
              variant: "default",
            });
          } else if (data?.success === false) {
            console.log("Update failed, attempting to create login for existing record (bulk upload case)");
            // If update failed (e.g. user not in Auth), try to CREATE
            try {
              const { data: createData, error: createFunctionError } = await supabase.functions.invoke('manage-users', {
                body: {
                  action: 'create',
                  email: currentFaculty.email,
                  password: currentFaculty.password,
                  role: 'faculty',
                  userData: payload
                }
              });

              if (!createFunctionError && createData?.success) {
                const newId = createData.userId;
                const oldId = currentFaculty.id;

                // Update the record's ID to match the new Auth ID
                const { error: idUpdateError } = await supabase
                  .from("faculty")
                  .update({ id: newId })
                  .eq("id", oldId);

                if (idUpdateError) {
                  console.error("Failed to sync record ID:", idUpdateError);
                  toast({
                    title: "Warning",
                    description: "Faculty updated, but login sync had issues.",
                    variant: "default",
                  });
                } else {
                  // Update children references
                  await supabase.from("ai_preferences").update({ faculty_id: newId }).eq("faculty_id", oldId);
                  await supabase.from("schedule_slots").update({ faculty_id: newId }).eq("faculty_id", oldId);
                }
              }
            } catch (createErr) {
              console.warn('Could not create auth account:', createErr);
            }
          }
        } catch (err) {
          console.warn('Edge Function call failed during update:', err);
          toast({
            title: "Partial Success",
            description: "Faculty updated, but password sync failed. Edge Function unavailable.",
            variant: "default",
          });
        }
      }
    } else {
      // For new faculty, try to create Auth user first via Edge Function
      let authUserId = null;

      try {
        if (currentFaculty.password) {
          const { data, error: functionError } = await supabase.functions.invoke('manage-users', {
            body: {
              action: 'create',
              email: currentFaculty.email,
              password: currentFaculty.password,
              role: 'faculty',
              userData: {
                name: currentFaculty.name,
                first_name: currentFaculty.name,
                ...payload
              }
            }
          });

          if (functionError) {
            console.warn('Edge Function not available:', functionError);
            toast({
              title: "Warning",
              description: "Faculty added without login credentials. Edge Function not deployed.",
              variant: "default",
            });
          } else if (data?.success === false || data?.error) {
            console.warn('Edge Function error:', data?.error);
            toast({
              title: "Warning",
              description: "Faculty added without login credentials. " + (data?.error || ""),
              variant: "default",
            });
          } else {
            authUserId = data.userId;
          }
        }
      } catch (err) {
        console.warn('Edge Function call failed:', err);
        // Continue without auth - we'll still create the faculty record
      }

      // Insert into the faculty table
      // If we got an auth user ID, use it; otherwise generate a new UUID
      const insertPayload = authUserId
        ? { ...payload, id: authUserId }
        : payload;

      const { error: insertError } = await supabase
        .from("faculty")
        .insert([insertPayload]);

      error = insertError;

      if (!error && !authUserId && currentFaculty.password) {
        toast({
          title: "Partial Success",
          description: "Faculty record created, but login account could not be set up. You may need to deploy the Edge Function.",
          variant: "default",
        });
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
        description: currentFaculty.id ? "Faculty member updated." : "Faculty member added.",
      });
      setIsDialogOpen(false);
      setCurrentFaculty(initialFacultyState);
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
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
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const { error } = await supabase.from("faculty").delete().in("id", selectedIds);
    if (error) {
      toast({
        title: "Bulk Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedIds.length} faculty members.`,
      });
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === facultyList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(facultyList.map(f => f.id));
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

        const facultyToInsert = json.map((row: unknown) => {
          const r = row as ExcelFacultyRow;
          return {
            name: r.name || r.Name || r.NAME || "",
            email: r.email || r.Email || r.EMAIL || "",
            priority: (r.priority || r.Priority || r.PRIORITY || "junior").toLowerCase(),
            department: r.department || r.Department || r.DEPARTMENT || null,
            designation: r.designation || r.Designation || r.DESIGNATION || null,
          };
        }).filter(f => f.name || f.email);

        if (facultyToInsert.length === 0) {
          throw new Error("No valid faculty data found.");
        }

        setPreviewData(facultyToInsert);
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

  const handlePreviewCellEdit = (index: number, field: keyof Omit<Faculty, "id">, value: string) => {
    const newData = [...previewData];
    newData[index] = { ...newData[index], [field]: value } as Omit<Faculty, "id">;
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
      const { error } = await supabase.from("faculty").insert(previewData);
      if (error) throw error;

      toast({
        title: "Bulk Upload Success",
        description: `Successfully uploaded ${previewData.length} members.`,
      });
      setIsPreviewDialogOpen(false);
      setPreviewData([]);
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
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
      { name: "John Doe", email: "john@example.com", priority: "senior", department: "Computer Science", designation: "Professor" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Faculty_Template.xlsx");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Faculty Management</h1>
            {selectedIds.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedIds.length} members selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchFaculty} disabled={loading}>
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
                  <DialogTitle>Bulk Upload Faculty</DialogTitle>
                  <DialogDescription>Upload an Excel file with faculty details.</DialogDescription>
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
              <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Review Faculty Data</DialogTitle>
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
                        <TableHead>Designation</TableHead>
                        <TableHead>Priority</TableHead>
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
                              value={row.designation || ""}
                              onChange={(e) => handlePreviewCellEdit(index, "designation", e.target.value)}
                              className="h-8 py-1"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Select
                              value={row.priority}
                              onValueChange={(v) => handlePreviewCellEdit(index, "priority", v)}
                            >
                              <SelectTrigger className="h-8 py-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="senior">Senior</SelectItem>
                                <SelectItem value="junior">Junior</SelectItem>
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

            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setCurrentFaculty(initialFacultyState); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Faculty</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{currentFaculty.id ? "Edit Faculty" : "Add New Faculty"}</DialogTitle>
                  <DialogDescription>Enter the details for the faculty member.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddOrUpdateFaculty} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={currentFaculty.name} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={currentFaculty.email} onChange={handleInputChange} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password {currentFaculty.id && "(Leave blank to keep current)"}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={currentFaculty.password}
                      onChange={handleInputChange}
                      required={!currentFaculty.id}
                      minLength={6}
                      placeholder="Min. 6 characters"
                    />
                    <p className="text-[10px] text-muted-foreground">Login requires at least 6 characters.</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input id="designation" value={currentFaculty.designation} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select onValueChange={(v) => handleSelectChange(v, "priority")} value={currentFaculty.priority}>
                      <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select onValueChange={(v) => handleSelectChange(v, "department")} value={currentFaculty.department}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full mt-4">{currentFaculty.id ? "Save Changes" : "Add Faculty"}</Button>
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

          <div className="w-[200px]">
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

          <div className="w-[150px]">
            <Label className="mb-2 block">Priority</Label>
            <Select value={filters.priority} onValueChange={(v) => handleFilterChange("priority", v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
                <SelectItem value="junior">Junior</SelectItem>
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
                      checked={facultyList.length > 0 && selectedIds.length === facultyList.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facultyList.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No faculty found.</TableCell></TableRow>
                ) : (
                  facultyList.map((faculty) => (
                    <TableRow key={faculty.id} className={selectedIds.includes(faculty.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(faculty.id)}
                          onCheckedChange={() => toggleSelectRow(faculty.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {faculty.name}
                        {faculty.designation && <p className="text-xs text-muted-foreground font-normal">{faculty.designation}</p>}
                      </TableCell>
                      <TableCell>{faculty.email}</TableCell>
                      <TableCell className="capitalize">{faculty.priority}</TableCell>
                      <TableCell>{faculty.department}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditFaculty(faculty)}>
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
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

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min(totalCount, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(totalCount, currentPage * itemsPerPage)} of {totalCount} members
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

export default FacultyManagement;