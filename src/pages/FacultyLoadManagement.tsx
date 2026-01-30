"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Users,
    BookOpen,
    Settings,
    Building2,
    ArrowRightLeft,
    Loader2,
    Plus,
    Trash2,
    Star,
    AlertTriangle
} from "lucide-react";

interface Faculty {
    id: string;
    name: string;
    email: string;
    department_id: string | null;
    departments?: { name: string } | null;
}

interface Subject {
    id: string;
    name: string;
    code: string;
    department_id: string | null;
}

interface Department {
    id: string;
    name: string;
}

interface FacultySubjectMapping {
    id: string;
    faculty_id: string;
    subject_id: string;
    proficiency_level: 'expert' | 'proficient' | 'basic';
    preferred: boolean;
    subjects?: { name: string; code: string } | null;
}

interface WorkloadConfig {
    id?: string;
    faculty_id: string;
    max_hours_per_day: number;
    max_hours_per_week: number;
    max_consecutive_hours: number;
    preferred_break_duration: number;
    is_cross_department: boolean;
    department_ids: string[];
}

const FacultyLoadManagement = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("mapping");

    // Fetch faculty
    const { data: faculty = [], isLoading: loadingFaculty } = useQuery({
        queryKey: ['faculty-all'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('faculty')
                .select('id, name, email, department_id, departments(name)')
                .order('name');
            if (error) throw error;
            return data as Faculty[];
        }
    });

    // Fetch subjects
    const { data: subjects = [] } = useQuery({
        queryKey: ['subjects-all'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('subjects')
                .select('id, name, code, department_id')
                .order('name');
            if (error) throw error;
            return data as Subject[];
        }
    });

    // Fetch departments
    const { data: departments = [] } = useQuery({
        queryKey: ['departments-all'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('departments')
                .select('id, name')
                .order('name');
            if (error) throw error;
            return data as Department[];
        }
    });

    // Fetch faculty subject mappings
    const { data: mappings = [], refetch: refetchMappings } = useQuery({
        queryKey: ['faculty-subject-mappings', selectedFaculty],
        queryFn: async () => {
            if (!selectedFaculty) return [];
            const { data, error } = await supabase
                .from('faculty_subject_mapping')
                .select('*, subjects(name, code)')
                .eq('faculty_id', selectedFaculty);
            if (error) throw error;
            return data as FacultySubjectMapping[];
        },
        enabled: !!selectedFaculty
    });

    // Fetch workload config
    const { data: workloadConfig, refetch: refetchWorkload } = useQuery({
        queryKey: ['faculty-workload-config', selectedFaculty],
        queryFn: async () => {
            if (!selectedFaculty) return null;
            const { data, error } = await supabase
                .from('faculty_workload_config')
                .select('*')
                .eq('faculty_id', selectedFaculty)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data as WorkloadConfig | null;
        },
        enabled: !!selectedFaculty
    });

    const selectedFacultyData = faculty.find(f => f.id === selectedFaculty);

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="h-8 w-8 text-indigo-600" />
                        Faculty Load & Multi-Department Management
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Configure faculty workload, subject assignments, and cross-department teaching
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Faculty List Sidebar */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-lg">Faculty Members</CardTitle>
                            <CardDescription>Select a faculty to configure</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingFaculty ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {faculty.map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFaculty(f.id)}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${selectedFaculty === f.id
                                                    ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                                                    : 'hover:bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            <div className="font-medium text-sm">{f.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {f.departments?.name || 'No department'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        {!selectedFaculty ? (
                            <Card>
                                <CardContent className="py-16">
                                    <div className="text-center text-muted-foreground">
                                        <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg">Select a faculty member to configure their load and assignments</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {/* Faculty Header */}
                                <Card className="mb-6">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-bold">{selectedFacultyData?.name}</h2>
                                                <p className="text-muted-foreground">{selectedFacultyData?.email}</p>
                                            </div>
                                            <Badge variant="outline" className="text-sm">
                                                <Building2 className="h-3 w-3 mr-1" />
                                                {selectedFacultyData?.departments?.name || 'No Department'}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Tabs for different configurations */}
                                <Tabs value={activeTab} onValueChange={setActiveTab}>
                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="mapping" className="flex items-center gap-2">
                                            <BookOpen className="h-4 w-4" />
                                            Subject Mapping
                                        </TabsTrigger>
                                        <TabsTrigger value="workload" className="flex items-center gap-2">
                                            <Settings className="h-4 w-4" />
                                            Workload Config
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Subject Mapping Tab */}
                                    <TabsContent value="mapping">
                                        <SubjectMappingPanel
                                            facultyId={selectedFaculty}
                                            mappings={mappings}
                                            subjects={subjects}
                                            refetchMappings={refetchMappings}
                                        />
                                    </TabsContent>

                                    {/* Workload Configuration Tab */}
                                    <TabsContent value="workload">
                                        <WorkloadConfigPanel
                                            facultyId={selectedFaculty}
                                            workloadConfig={workloadConfig}
                                            departments={departments}
                                            refetchWorkload={refetchWorkload}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

// Subject Mapping Panel Component
const SubjectMappingPanel: React.FC<{
    facultyId: string;
    mappings: FacultySubjectMapping[];
    subjects: Subject[];
    refetchMappings: () => void;
}> = ({ facultyId, mappings, subjects, refetchMappings }) => {
    const { toast } = useToast();
    const [newSubjectId, setNewSubjectId] = useState("");
    const [newProficiency, setNewProficiency] = useState<'expert' | 'proficient' | 'basic'>('proficient');
    const [newPreferred, setNewPreferred] = useState(false);

    const handleAddMapping = async () => {
        if (!newSubjectId) {
            toast({ title: "Error", description: "Please select a subject", variant: "destructive" });
            return;
        }

        const { error } = await supabase
            .from('faculty_subject_mapping')
            .insert({
                faculty_id: facultyId,
                subject_id: newSubjectId,
                proficiency_level: newProficiency,
                preferred: newPreferred
            });

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Success", description: "Subject mapping added" });
            setNewSubjectId("");
            setNewProficiency('proficient');
            setNewPreferred(false);
            refetchMappings();
        }
    };

    const handleDeleteMapping = async (mappingId: string) => {
        const { error } = await supabase
            .from('faculty_subject_mapping')
            .delete()
            .eq('id', mappingId);

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Success", description: "Subject mapping removed" });
            refetchMappings();
        }
    };

    const availableSubjects = subjects.filter(
        s => !mappings.some(m => m.subject_id === s.id)
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Subject Assignments</CardTitle>
                <CardDescription>
                    Map this faculty member to subjects they can teach with proficiency levels
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Add New Mapping */}
                <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Subject Assignment
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <Label>Subject</Label>
                            <Select value={newSubjectId} onValueChange={setNewSubjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSubjects.map(subject => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                            {subject.name} ({subject.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Proficiency</Label>
                            <Select value={newProficiency} onValueChange={(v: any) => setNewProficiency(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expert">Expert</SelectItem>
                                    <SelectItem value="proficient">Proficient</SelectItem>
                                    <SelectItem value="basic">Basic</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleAddMapping} className="w-full">
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Current Mappings */}
                <div>
                    <h3 className="font-semibold mb-4">Current Assignments ({mappings.length})</h3>
                    {mappings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No subjects assigned yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {mappings.map(mapping => (
                                <div
                                    key={mapping.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        {mapping.preferred && (
                                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        )}
                                        <div>
                                            <div className="font-medium">
                                                {mapping.subjects?.name || 'Unknown Subject'}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {mapping.subjects?.code}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant={
                                                mapping.proficiency_level === 'expert'
                                                    ? 'default'
                                                    : mapping.proficiency_level === 'proficient'
                                                        ? 'secondary'
                                                        : 'outline'
                                            }
                                        >
                                            {mapping.proficiency_level}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteMapping(mapping.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Workload Configuration Panel Component
const WorkloadConfigPanel: React.FC<{
    facultyId: string;
    workloadConfig: WorkloadConfig | null;
    departments: Department[];
    refetchWorkload: () => void;
}> = ({ facultyId, workloadConfig, departments, refetchWorkload }) => {
    const { toast } = useToast();
    const [config, setConfig] = useState<Partial<WorkloadConfig>>({
        max_hours_per_day: 6,
        max_hours_per_week: 30,
        max_consecutive_hours: 3,
        preferred_break_duration: 60,
        is_cross_department: false,
        department_ids: []
    });

    React.useEffect(() => {
        if (workloadConfig) {
            setConfig(workloadConfig);
        }
    }, [workloadConfig]);

    const handleSave = async () => {
        const payload = {
            faculty_id: facultyId,
            max_hours_per_day: config.max_hours_per_day,
            max_hours_per_week: config.max_hours_per_week,
            max_consecutive_hours: config.max_consecutive_hours,
            preferred_break_duration: config.preferred_break_duration,
            is_cross_department: config.is_cross_department,
            department_ids: config.department_ids
        };

        const { error } = workloadConfig
            ? await supabase
                .from('faculty_workload_config')
                .update(payload)
                .eq('id', workloadConfig.id!)
            : await supabase
                .from('faculty_workload_config')
                .insert(payload);

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Success", description: "Workload configuration saved" });
            refetchWorkload();
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Workload Configuration</CardTitle>
                <CardDescription>
                    Set maximum teaching hours and cross-department preferences
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>Max Hours Per Day</Label>
                        <Input
                            type="number"
                            min={1}
                            max={12}
                            value={config.max_hours_per_day}
                            onChange={(e) => setConfig({ ...config, max_hours_per_day: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Maximum teaching hours in a single day</p>
                    </div>
                    <div>
                        <Label>Max Hours Per Week</Label>
                        <Input
                            type="number"
                            min={1}
                            max={60}
                            value={config.max_hours_per_week}
                            onChange={(e) => setConfig({ ...config, max_hours_per_week: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Maximum teaching hours per week</p>
                    </div>
                    <div>
                        <Label>Max Consecutive Hours</Label>
                        <Input
                            type="number"
                            min={1}
                            max={6}
                            value={config.max_consecutive_hours}
                            onChange={(e) => setConfig({ ...config, max_consecutive_hours: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Maximum continuous teaching hours</p>
                    </div>
                    <div>
                        <Label>Preferred Break Duration (minutes)</Label>
                        <Input
                            type="number"
                            min={0}
                            max={120}
                            value={config.preferred_break_duration}
                            onChange={(e) => setConfig({ ...config, preferred_break_duration: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Minimum break time between classes</p>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <Label className="text-base">Cross-Department Teaching</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow this faculty to teach across multiple departments
                            </p>
                        </div>
                        <Switch
                            checked={config.is_cross_department}
                            onCheckedChange={(checked) => setConfig({ ...config, is_cross_department: checked })}
                        />
                    </div>

                    {config.is_cross_department && (
                        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <ArrowRightLeft className="h-4 w-4 text-orange-600" />
                                <span className="font-medium text-orange-900">Cross-Department Configuration</span>
                            </div>
                            <p className="text-sm text-orange-800 mb-3">
                                Select departments this faculty can teach in:
                            </p>
                            <div className="space-y-2">
                                {departments.map(dept => (
                                    <label key={dept.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.department_ids?.includes(dept.id)}
                                            onChange={(e) => {
                                                const newDepts = e.target.checked
                                                    ? [...(config.department_ids || []), dept.id]
                                                    : (config.department_ids || []).filter(id => id !== dept.id);
                                                setConfig({ ...config, department_ids: newDepts });
                                            }}
                                            className="rounded border-orange-300"
                                        />
                                        <span className="text-sm">{dept.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleSave} size="lg">
                        Save Configuration
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default FacultyLoadManagement;
