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
import { Slider } from "@/components/ui/slider";
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
  value: string;
  isActive: boolean;
  description?: string;
  aiWeight: number; // Importance factor for AI scoring
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
      aiWeight: 80,
    },
    {
      id: "rule2",
      name: "Lab in Lab Room Only",
      ruleType: "Room Capacity",
      value: '{"subject_type": "lab", "room_type": "lab"}',
      isActive: true,
      description: "Lab subjects must be scheduled in lab rooms.",
      aiWeight: 100,
    },
  ]);
  const [newRule, setNewRule] = React.useState({
    name: "",
    ruleType: "",
    value: "",
    isActive: true,
    description: "",
    aiWeight: 50,
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

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `rule${rules.length + 1}`;
    setRules((prev) => [...prev, { id, ...newRule }]);
    setNewRule({ name: "", ruleType: "", value: "", isActive: true, description: "", aiWeight: 50 });
    setIsDialogOpen(false);
    toast({ title: "Success", description: "Rule weight saved." });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">AI Rule Weight Management</h1>

        <div className="flex justify-end mb-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Configure New AI Rule</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>New AI Constraint</DialogTitle>
                <DialogDescription>Define how much the AI should prioritize this rule.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddRule} className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Rule Name</Label>
                  <Input id="name" value={newRule.name} onChange={handleInputChange} required />
                </div>
                <div className="grid gap-2">
                  <Label>AI Weight (Importance: {newRule.aiWeight}%)</Label>
                  <Slider 
                    value={[newRule.aiWeight]} 
                    onValueChange={(v) => setNewRule(p => ({ ...p, aiWeight: v[0] }))}
                    max={100}
                    step={5}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Higher weight forces the AI to strictly adhere to this constraint.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Rule JSON</Label>
                  <Textarea id="value" value={newRule.value} onChange={handleInputChange} required />
                </div>
                <Button type="submit">Save Constraint</Button>
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
                <TableHead>AI Weight</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>{rule.ruleType}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${rule.aiWeight}%` }} />
                      </div>
                      <span className="text-xs">{rule.aiWeight}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded ${rule.aiWeight > 75 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {rule.aiWeight > 75 ? 'Critical' : 'Moderate'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
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