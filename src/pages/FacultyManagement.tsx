"use client";

import React, { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast"; // Using shadcn's toast

interface Faculty {
  id: string;
  name: string;
  email: string;
  priority: "senior" | "junior";
  department: string;
}

const mockDepartments = ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering"];

const FacultyManagement = () => {
  const [facultyList, setFacultyList] = useState<Faculty[]>([
    { id: "1", name: "Dr. Alice Smith", email: "alice.s@example.com", priority: "senior", department: "Computer Science" },
    { id: "2", name: "Prof. Bob Johnson", email: "bob.j@example.com", priority: "junior", department: "Electrical Engineering" },
    { id: "3", name: "Dr. Carol White", email: "carol.w@example.com", priority: "senior", department: "Mechanical Engineering" },
  ]);
  const [newFaculty, setNewFaculty] = useState({
    name: "",
    email: "",
    priority: "junior",
    department: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewFaculty((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, id: string) => {
    setNewFaculty((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaculty.name || !newFaculty.email || !newFaculty.department) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const id = (facultyList.length + 1).toString(); // Simple ID generation
    setFacultyList((prev) => [...prev, { id, ...newFaculty, priority: newFaculty.priority as "senior" | "junior" }]);
    setNewFaculty({ name: "", email: "", priority: "junior", department: "" }); // Reset form
    setIsDialogOpen(false);
    toast({
      title: "Success",
      description: "Faculty member added successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Faculty Management</h1>

        <div className="flex justify-end mb-4">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newFaculty.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newFaculty.email}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priority
                  </Label>
                  <Select
                    onValueChange={(value) => handleSelectChange(value, "priority")}
                    value={newFaculty.priority}
                    required
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="junior">Junior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">
                    Department
                  </Label>
                  <Select
                    onValueChange={(value) => handleSelectChange(value, "department")}
                    value={newFaculty.department}
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
                <Button type="submit" className="w-full mt-4">
                  Add Faculty
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
                <TableHead>Email</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facultyList.map((faculty) => (
                <TableRow key={faculty.id}>
                  <TableCell className="font-medium">{faculty.name}</TableCell>
                  <TableCell>{faculty.email}</TableCell>
                  <TableCell>{faculty.priority}</TableCell>
                  <TableCell>{faculty.department}</TableCell>
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

export default FacultyManagement;