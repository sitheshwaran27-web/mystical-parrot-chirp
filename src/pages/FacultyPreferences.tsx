"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/context/SessionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, Trash2, Plus, Clock } from "lucide-react";

interface Preference {
  id: string;
  subject_id: string;
  preferred_day: string;
  preferred_time_slot: string;
  weight: number;
  subjects: { name: string } | null;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMES = ["08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00", "13:00-14:00", "14:00-15:00", "15:00-16:00"];

const FacultyPreferences = () => {
  const { user } = useSession();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newPref, setNewPref] = useState({
    subject_id: "",
    preferred_day: "Monday",
    preferred_time_slot: "08:00-09:00",
    weight: 1.0
  });

  useEffect(() => {
    if (user) {
      fetchPreferences();
      fetchSubjects();
    }
  }, [user]);

  const fetchPreferences = async () => {
    const { data } = await supabase
      .from("ai_preferences")
      .select("id, subject_id, preferred_day, preferred_time_slot, weight, subjects(name)")
      .eq("faculty_id", user?.id);
    setPreferences(data as any[] || []);
    setLoading(false);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from("subjects").select("id, name");
    setSubjects(data || []);
  };

  const handleAddPreference = async () => {
    if (!newPref.subject_id) return;
    setSaving(true);
    const { error } = await supabase.from("ai_preferences").insert([{
      ...newPref,
      faculty_id: user?.id
    }]);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Preference Saved", description: "AI will prioritize this slot for you." });
      fetchPreferences();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("ai_preferences").delete().eq("id", id);
    fetchPreferences();
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-3 mb-8">
          <Star className="h-8 w-8 text-amber-500" />
          <div>
            <h1 className="text-3xl font-bold">Teaching Preferences</h1>
            <p className="text-muted-foreground">The AI engine uses these as 'Soft Constraints' to build your ideal schedule.</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Add Preference</CardTitle>
              <CardDescription>Nominate slots where you'd prefer to teach.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Select onValueChange={(v) => setNewPref(p => ({ ...p, subject_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Day</label>
                <Select onValueChange={(v) => setNewPref(p => ({ ...p, preferred_day: v }))} defaultValue="Monday">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Slot</label>
                <Select onValueChange={(v) => setNewPref(p => ({ ...p, preferred_time_slot: v }))} defaultValue="08:00-09:00">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddPreference} className="w-full" disabled={saving}>
                {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Add AI Constraint
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Your Active Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8" /></div> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Preferred Slot</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preferences.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No preferences set yet.</TableCell></TableRow>
                    ) : (
                      preferences.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.subjects?.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="h-3 w-3" />
                              {p.preferred_day}, {p.preferred_time_slot}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FacultyPreferences;