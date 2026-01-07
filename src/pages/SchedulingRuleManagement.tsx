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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface SchedulingRule {
  id: string;
  name: string;
  ruleType: string;
  value: string; // Storing JSON string for simplicity in placeholder
  isActive: boolean;
  description?: string;
}

const ruleTypes = [
  "Max Consecutive Hours",
  "Faculty Preference",
  "Room Capacity",
  "Subject Type Constraint",
  "Break Time",
];

const SchedulingRuleManagement = () => {
  const [rules, setRules] = React.useState<SchedulingRule[]>([
    {
      id: "rule1",
      name: "Max 3 Theory Classes/Day",
      ruleType: "Max Consecutive Hours",
      value: '{"max_hours": 3, "subject_type": "theory"}',
      isActive: true,
      description: "Faculty should not have more than 3 consecutive theory classes.",
    },
    {
      id: "rule2",
      name: "Lab in Lab Room Only",
      ruleType: "Room Capacity",
      value: '{"subject_type": "lab", "room_type": "lab"}',
      isActive: true,
      description: "Lab subjects must be scheduled in lab rooms.",
    },
  ]);
  const [newRule, setNewRule] = React.useState({
    name: "",
    ruleType: "",
    value: "",
    isActive: true,
    description: "",
  });
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewRule((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string, id: string) => {
    setNewRule((prev) => ({ ...prev, [id]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setNewRule((prev) => ({ ...prev, isActive: checked }));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name || !newRule.ruleType || !newRule.value) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      JSON.parse(newRule.value); // Validate if value is valid JSON
    } catch (error) {
      toast({
        title: "Error",
        description: "Rule Value must be a valid JSON string.",
        variant: "destructive",
      });
      return;
    }

    const id = `rule${rules.length + 1}`;
    setRules((prev) => [...prev, { id, ...newRule }]);
    setNewRule({ name: "", ruleType: "", value: "", isActive: true, description: "" });
    setIsDialogOpen(false);
    toast({
      title: "Success",
      description: "Scheduling rule added successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Scheduling Rule Management</h1>

        <div className="flex justify-end mb-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add Rule</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Scheduling Rule</DialogTitle>
                <DialogDescription>
                  Define a new rule for timetable generation.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddRule} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Rule Name
                  </Label>
                  <Input
                    id="name"
                    value={newRule.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ruleType" className="text-right">
                    Rule Type
                  </Label>
                  <Select
                    onValueChange={(value) => handleSelectChange(value, "ruleType")}
                    value={newRule.ruleType}
                    required
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select rule type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="value" className="text-right">
                    Rule Value (JSON)
                  </Label>
                  <Textarea
                    id="value"
                    value={newRule.value}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder='e.g., {"max_hours": 3, "subject_type": "theory"}'
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newRule.description}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="A brief explanation of the rule."
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isActive" className="text-right">
                    Active
                  </Label>
                  <Switch
                    id="isActive"
                    checked={newRule.isActive}
                    onCheckedChange={handleSwitchChange}
                    className="col-span-3 justify-self-start"
                  />
                </div>
                <Button type="submit" className="w-full mt-4">
                  Add Rule
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>{rule.ruleType}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{rule.value}</TableCell>
                  <TableCell>{rule.isActive ? "Yes" : "No"}</TableCell>
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

export default SchedulingRuleManagement;