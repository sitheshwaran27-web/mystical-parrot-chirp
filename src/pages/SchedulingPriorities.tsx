import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Info, Save, ArrowLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const SchedulingPriorities = () => {
    const [facultyWorkloadWeight, setFacultyWorkloadWeight] = useState([70]);
    const [studentGapWeight, setStudentGapWeight] = useState([50]);
    const [labSpacingWeight, setLabSpacingWeight] = useState([80]);

    return (
        <div className="min-h-screen bg-[#edf2f9] -m-8 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative flex flex-col items-center pt-2 pb-4">
                    <div className="absolute left-0 top-0 pt-2">
                        <Link to="/dashboard">
                            <Button variant="ghost" className="text-slate-500 hover:text-slate-700 text-lg font-medium gap-2 pl-0 hover:bg-transparent transition-colors">
                                <ArrowLeft className="h-5 w-5" /> Back
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="border-[1.5px] border-blue-400/40 bg-white px-10 py-3 rounded-xl shadow-sm">
                            <h1 className="text-3xl font-bold text-[#2d3748] tracking-tight text-center">Set Scheduling Priorities</h1>
                        </div>
                        <p className="text-slate-500 text-lg font-medium text-center">
                            Configure how the AI prioritizes different constraints during timetable generation.
                        </p>
                    </div>
                </div>

                {/* Main Content Container */}
                <Card className="bg-white rounded-[2rem] border-none shadow-xl shadow-blue-900/5 p-8 md:p-12">
                    <div className="grid gap-8 md:grid-cols-2">
                        <Card className="border-slate-100 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#2d3748]">
                                    Weight Configuration
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="h-4 w-4 text-slate-400" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="w-64">Adjust the importance of these factors for the AI algorithm. Higher weights mean stricter optimization.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </CardTitle>
                                <CardDescription>
                                    Higher weights mean the AI will try harder to satisfy these constraints.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold text-[#2d3748]">Balanced Faculty Workload</Label>
                                        <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{facultyWorkloadWeight}%</span>
                                    </div>
                                    <Slider
                                        value={facultyWorkloadWeight}
                                        onValueChange={setFacultyWorkloadWeight}
                                        max={100}
                                        step={5}
                                        className="py-2"
                                    />
                                    <p className="text-sm text-slate-500">
                                        Ensure classes are distributed evenly across the week for faculty.
                                    </p>
                                </div>

                                <Separator className="bg-slate-100" />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold text-[#2d3748]">Minimize Student Gaps</Label>
                                        <span className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{studentGapWeight}%</span>
                                    </div>
                                    <Slider
                                        value={studentGapWeight}
                                        onValueChange={setStudentGapWeight}
                                        max={100}
                                        step={5}
                                        className="py-2"
                                    />
                                    <p className="text-sm text-slate-500">
                                        Avoid long free periods between classes for students.
                                    </p>
                                </div>

                                <Separator className="bg-slate-100" />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold text-[#2d3748]">Lab Spacing</Label>
                                        <span className="font-mono text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">{labSpacingWeight}%</span>
                                    </div>
                                    <Slider
                                        value={labSpacingWeight}
                                        onValueChange={setLabSpacingWeight}
                                        max={100}
                                        step={5}
                                        className="py-2"
                                    />
                                    <p className="text-sm text-slate-500">
                                        E.g., Avoid scheduling Labs immediately after a heavy lecture block.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-8">
                            <Card className="border-slate-100 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-[#2d3748]">Hard Constraints</CardTitle>
                                    <CardDescription>Rules that MUST strictly be followed.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="no-overlap" className="flex-1 font-medium text-[#2d3748]">
                                            No double booking (Class/Room/Faculty)
                                        </Label>
                                        <Switch id="no-overlap" checked disabled />
                                    </div>
                                    <Separator className="bg-slate-100" />
                                    <div className="flex items-center justify-between space-x-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="lunch-break" className="font-medium text-[#2d3748]">Force Lunch Break</Label>
                                            <p className="text-sm text-slate-500 font-medium">12:30 PM - 01:30 PM</p>
                                        </div>
                                        <Switch id="lunch-break" defaultChecked className="data-[state=checked]:bg-blue-600" />
                                    </div>
                                    <Separator className="bg-slate-100" />
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label htmlFor="max-hours" className="flex-1 font-medium text-[#2d3748]">
                                            Max Daily Hours per Faculty
                                        </Label>
                                        <Select defaultValue="6">
                                            <SelectTrigger className="w-[100px] border-slate-200">
                                                <SelectValue placeholder="Hours" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="4">4 hrs</SelectItem>
                                                <SelectItem value="5">5 hrs</SelectItem>
                                                <SelectItem value="6">6 hrs</SelectItem>
                                                <SelectItem value="8">8 hrs</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-slate-100 shadow-sm bg-slate-50/30">
                                <CardHeader>
                                    <CardTitle className="text-[#2d3748]">Algorithm Selection</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-3">
                                        <Label className="font-semibold text-[#2d3748]">Optimization Strategy</Label>
                                        <Select defaultValue="balanced">
                                            <SelectTrigger className="bg-white border-slate-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="balanced">Balanced (Recommended)</SelectItem>
                                                <SelectItem value="faculty-first">Faculty Comfort First</SelectItem>
                                                <SelectItem value="student-first">Student Compact Schedule</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold shadow-lg shadow-blue-600/20" size="lg">
                                        <Save className="mr-2 h-5 w-5" /> Save Priorities
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SchedulingPriorities;
