"use client";

import React from "react";
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
import { useToast } from "@/components/ui/use-toast";

// Placeholder for Batch data
interface Batch {
  id: string;
  name: string;
  department: string;
  year: number;
  semester: number;
}

const mockDepartments = ["Computer Science Engineering", "Electrical Engineering"];

const BatchManagement = () => {
  const [batches, setBatches] = React.useState<Batch[]>([
    { id: "b1", name: "CSE 2025 Batch A", department: "Computer Science Engineering", year: 2025, semester: 1 },
    { id: "b2", name: "EEE 2024 Batch B", department: "Electrical Engineering", year: 2024, semester: 2 },
  ]);
  const [newBatch, setNewBatch] = React.useState({
    name: "",
    department: "",
    year: new Date().getFullYear(),
    semester: 1,
  });
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewBatch((prev) => ({
      ...prev,
      [id]: id === "year" || id === "semester" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSelectChange = (value: string, id: string) => {
    setNewBatch((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name || !newBatch.department || newBatch.year <= 0 || newBatch.semester <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields correctly.",
        variant: "destructive",
      });
      return;
    }

    const id = `b${batches.length + 1}`;
    setBatches((prev) => [...prev, { id, ...newBatch }]);
    setNewBatch({ name: "", department: "", year: new Date().getFullYear(), semester: 1 });
    setIsDialogOpen(false);
    toast({
      title: "Success",
      description: "Batch added successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Batch Management</h1>

        <div className="flex justify-end mb-4">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newBatch.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">
                    Department
                  </Label>
                  <Select
                    onValueChange={(value) => handleSelectChange(value, "department")}
                    value={newBatch.department}
                    required
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Year
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={newBatch.year}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                    min="2000"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="semester" className="text-right">
                    Semester
                  </Label>
                  <Input
                    id="semester"
                    type="number"
                    value={newBatch.semester}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                    min="1"
                    max="8"
                  />
                </div>
                <Button type="submit" className="w-full mt-4">
                  Add Batch
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
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
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{batch.department}</TableCell>
                  <TableCell>{batch.year}</TableCell>
                  <TableCell>{batch.semester}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BatchManagement;