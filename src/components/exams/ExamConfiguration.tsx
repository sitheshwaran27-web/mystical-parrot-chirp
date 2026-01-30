
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Exam } from "@/types/exam";
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
import { CalendarIcon, Plus, Loader2, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ExamConfiguration() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Form State
    const [newExam, setNewExam] = useState<Partial<Exam>>({
        name: "",
        type: "Semester",
        morning_session_start: "09:30:00",
        morning_session_end: "12:30:00",
        afternoon_session_start: "13:30:00",
        afternoon_session_end: "16:30:00",
        is_active: true
    });

    const [dateRange, setDateRange] = useState<{ from?: Date, to?: Date }>({});

    // Fetch Exams
    const { data: exams, isLoading } = useQuery({
        queryKey: ['exams'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('exams')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Exam[];
        }
    });

    // Create Mutation
    const createExam = useMutation({
        mutationFn: async (examData: Partial<Exam>) => {
            const { error } = await supabase.from('exams').insert([examData]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            toast({ title: "Success", description: "Exam created successfully" });
            setIsDialogOpen(false);
            setNewExam({
                name: "",
                type: "Semester",
                morning_session_start: "09:30:00",
                morning_session_end: "12:30:00",
                afternoon_session_start: "13:30:00",
                afternoon_session_end: "16:30:00",
                is_active: true
            });
            setDateRange({});
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    // Delete Mutation
    const deleteExam = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('exams').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            toast({ title: "Deleted", description: "Exam deleted successfully" });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const handleCreate = () => {
        if (!newExam.name || !dateRange.from || !dateRange.to) {
            toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }

        createExam.mutate({
            ...newExam,
            start_date: format(dateRange.from, 'yyyy-MM-dd'),
            end_date: format(dateRange.to, 'yyyy-MM-dd'),
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Exam Cycles</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Create Exam</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create New Exam Cycle</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Exam Name</Label>
                                    <Input
                                        placeholder="e.g. Fall 2026 Finals"
                                        value={newExam.name}
                                        onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={newExam.type}
                                        onValueChange={(v: any) => setNewExam({ ...newExam, type: v })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Internal">Internal</SelectItem>
                                            <SelectItem value="Model">Model</SelectItem>
                                            <SelectItem value="Semester">Semester</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Morning Session</Label>
                                    <div className="flex gap-2">
                                        <Input type="time" value={newExam.morning_session_start} onChange={e => setNewExam({ ...newExam, morning_session_start: e.target.value })} />
                                        <span className="py-2">-</span>
                                        <Input type="time" value={newExam.morning_session_end} onChange={e => setNewExam({ ...newExam, morning_session_end: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Afternoon Session</Label>
                                    <div className="flex gap-2">
                                        <Input type="time" value={newExam.afternoon_session_start} onChange={e => setNewExam({ ...newExam, afternoon_session_start: e.target.value })} />
                                        <span className="py-2">-</span>
                                        <Input type="time" value={newExam.afternoon_session_end} onChange={e => setNewExam({ ...newExam, afternoon_session_end: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleCreate} disabled={createExam.isPending}>
                                {createExam.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Exam
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Details</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Sessions</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                        ) : exams?.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No exams found</TableCell></TableRow>
                        ) : (
                            exams?.map((exam) => (
                                <TableRow key={exam.id}>
                                    <TableCell>
                                        <div className="font-medium">{exam.name}</div>
                                        <div className="text-xs text-muted-foreground">{exam.type}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {format(new Date(exam.start_date), 'MMM d')} - {format(new Date(exam.end_date), 'MMM d, yyyy')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs space-y-1">
                                            <div>M: {exam.morning_session_start?.slice(0, 5)} - {exam.morning_session_end?.slice(0, 5)}</div>
                                            <div>A: {exam.afternoon_session_start?.slice(0, 5)} - {exam.afternoon_session_end?.slice(0, 5)}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn("px-2 py-1 rounded-full text-xs", exam.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700")}>
                                            {exam.is_active ? 'Active' : 'Closed'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => deleteExam.mutate(exam.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
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
