
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FacultyAbsence } from "@/types/absence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Plus, Loader2, UserX } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AbsenceList() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [newAbsence, setNewAbsence] = useState<Partial<FacultyAbsence>>({
        faculty_id: "",
        reason: ""
    });
    const [dateRange, setDateRange] = useState<{ from?: Date, to?: Date }>({});

    // Fetch Faculty
    const { data: facultyList } = useQuery({
        queryKey: ['faculty_list'],
        queryFn: async () => {
            const { data, error } = await supabase.from('faculty').select('id, name, department');
            if (error) throw error;
            return data;
        }
    });

    // Fetch Absences
    const { data: absences, isLoading } = useQuery({
        queryKey: ['faculty_absences'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('faculty_absences')
                .select('*, faculty(name, department)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as FacultyAbsence[];
        }
    });

    // Create Absence
    const createAbsence = useMutation({
        mutationFn: async (absenceData: Partial<FacultyAbsence>) => {
            const { error } = await supabase.from('faculty_absences').insert([absenceData]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faculty_absences'] });
            toast({ title: "Reported", description: "Absence recorded successfully" });
            setIsDialogOpen(false);
            setNewAbsence({ faculty_id: "", reason: "" });
            setDateRange({});
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const handleCreate = () => {
        if (!newAbsence.faculty_id || !dateRange.from || !dateRange.to) {
            toast({ title: "Error", description: "Faculty and Dates are required", variant: "destructive" });
            return;
        }

        createAbsence.mutate({
            ...newAbsence,
            start_date: format(dateRange.from, 'yyyy-MM-dd'),
            end_date: format(dateRange.to, 'yyyy-MM-dd'),
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Reported Absences</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-red-600 hover:bg-red-700"><UserX className="mr-2 h-4 w-4" /> Report Absence</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Report Faculty Absence</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Faculty Member</Label>
                                <Select
                                    value={newAbsence.faculty_id}
                                    onValueChange={(v) => setNewAbsence({ ...newAbsence, faculty_id: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select Faculty" /></SelectTrigger>
                                    <SelectContent>
                                        {facultyList?.map(f => (
                                            <SelectItem key={f.id} value={f.id}>{f.name} ({f.department})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Date Range</Label>
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateRange.from ? format(dateRange.from, "PPP") : <span>Start Date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={dateRange.from} onSelect={(d) => setDateRange({ ...dateRange, from: d })} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateRange.to ? format(dateRange.to, "PPP") : <span>End Date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar mode="single" selected={dateRange.to} onSelect={(d) => setDateRange({ ...dateRange, to: d })} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Reason (Optional)</Label>
                                <Input
                                    placeholder="e.g. Sick Leave, Personal"
                                    value={newAbsence.reason}
                                    onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
                                />
                            </div>

                            <Button onClick={handleCreate} disabled={createAbsence.isPending} className="w-full">
                                {createAbsence.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Report
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Faculty</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Logged At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : absences?.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No reports found</TableCell></TableRow>
                        ) : (
                            absences?.map((abs) => (
                                <TableRow key={abs.id}>
                                    <TableCell>
                                        <div className="font-medium">{abs.faculty?.name}</div>
                                        <div className="text-xs text-muted-foreground">{abs.faculty?.department}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {format(new Date(abs.start_date), 'MMM d')} - {format(new Date(abs.end_date), 'MMM d, yyyy')}
                                        </div>
                                    </TableCell>
                                    <TableCell>{abs.reason || '-'}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(abs.created_at || ''), 'PP p')}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
