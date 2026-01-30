
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExamHall } from "@/types/exam";
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
import { Plus, Loader2, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function ExamHalls() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [newHall, setNewHall] = useState<Partial<ExamHall>>({
        name: "",
        capacity: 30,
        department_id: "all"
    });

    // Fetch Halls
    const { data: halls, isLoading } = useQuery({
        queryKey: ['exam_halls'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('exam_halls')
                .select('*')
                .order('name');
            if (error) throw error;
            return data as ExamHall[];
        }
    });

    // Fetch Departments
    const { data: departments } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const { data, error } = await supabase.from('departments').select('name, id');
            if (error) throw error;
            return data as { name: string, id: string }[];
        }
    });

    // Create Hall
    const createHall = useMutation({
        mutationFn: async (hallData: Partial<ExamHall>) => {
            const payload = { ...hallData };
            if (payload.department_id === 'all') payload.department_id = null;

            const { error } = await supabase.from('exam_halls').insert([payload]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exam_halls'] });
            toast({ title: "Success", description: "Exam Hall added" });
            setIsDialogOpen(false);
            setNewHall({ name: "", capacity: 30, department_id: "all" });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    // Delete Hall
    const deleteHall = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('exam_halls').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exam_halls'] });
            toast({ title: "Deleted", description: "Hall removed" });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const handleCreate = () => {
        if (!newHall.name || !newHall.capacity) {
            toast({ title: "Error", description: "Name and Capacity are required", variant: "destructive" });
            return;
        }
        createHall.mutate(newHall);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Exam Halls</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Hall</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Exam Hall</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Hall Name / Number</Label>
                                <Input
                                    placeholder="e.g. A-101, Auditiorium"
                                    value={newHall.name}
                                    onChange={(e) => setNewHall({ ...newHall, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Capacity</Label>
                                <Input
                                    type="number"
                                    value={newHall.capacity}
                                    onChange={(e) => setNewHall({ ...newHall, capacity: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Department (Optional)</Label>
                                <Select
                                    value={newHall.department_id || "all"}
                                    onValueChange={(v) => setNewHall({ ...newHall, department_id: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="General Pool" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">General Use (All Depts)</SelectItem>
                                        {departments?.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleCreate} disabled={createHall.isPending} className="w-full">
                                {createHall.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
                                Add Hall
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : halls?.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground border rounded-md border-dashed">No exam halls configured</div>
                ) : (
                    halls?.map((hall) => (
                        <div key={hall.id} className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow flex justify-between items-start">
                            <div>
                                <div className="font-medium flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    {hall.name}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">Capacity: {hall.capacity} students</div>
                                {hall.department_id && departments && (
                                    <div className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded mt-2 inline-block">
                                        {departments.find(d => d.id === hall.department_id)?.name || 'Specific Dept'}
                                    </div>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteHall.mutate(hall.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
