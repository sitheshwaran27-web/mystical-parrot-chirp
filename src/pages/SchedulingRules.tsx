import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Clock,
    Calendar,
    Coffee,
    Save,
    ArrowLeft,
    Plus,
    Trash2,
    Timer,
    LayoutList,
    FlaskConical,
    Loader2
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface Break {
    id: string;
    name: string;
    start: string;
    end: string;
    type: 'lunch' | 'short';
}

const SchedulingRules = () => {
    const { data: timingsData, loading: timingsLoading, updateSetting: updateTimings } = useSystemSettings('college_timings');
    const { data: breaksData, loading: breaksLoading, updateSetting: updateBreaks } = useSystemSettings('breaks');

    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("16:30");
    const [numPeriods, setNumPeriods] = useState(7);
    const [periodDuration, setPeriodDuration] = useState(50);
    const [breakGap, setBreakGap] = useState(0);
    const [labDuration, setLabDuration] = useState(3);
    const [breaks, setBreaks] = useState<Break[]>([]);
    const [saving, setSaving] = useState(false);

    // Load data from database
    useEffect(() => {
        if (timingsData) {
            setStartTime(timingsData.start_time || "09:00");
            setEndTime(timingsData.end_time || "16:30");
            setNumPeriods(timingsData.num_periods || 7);
            setPeriodDuration(timingsData.period_duration || 50);
            setBreakGap(timingsData.break_gap || 0);
            setLabDuration(timingsData.lab_duration || 3);
        }
    }, [timingsData]);

    useEffect(() => {
        if (breaksData && Array.isArray(breaksData)) {
            setBreaks(breaksData);
        }
    }, [breaksData]);

    const addBreak = () => {
        const newBreak: Break = {
            id: Math.random().toString(36).substr(2, 9),
            name: "New Break",
            start: "10:00",
            end: "10:15",
            type: 'short'
        };
        setBreaks([...breaks, newBreak]);
    };

    const removeBreak = (id: string) => {
        setBreaks(breaks.filter(b => b.id !== id));
    };

    const updateBreak = (id: string, field: keyof Break, value: string) => {
        setBreaks(breaks.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleSave = async () => {
        setSaving(true);

        const timingsSuccess = await updateTimings({
            start_time: startTime,
            end_time: endTime,
            num_periods: numPeriods,
            period_duration: periodDuration,
            break_gap: breakGap,
            lab_duration: labDuration
        });

        const breaksSuccess = await updateBreaks(breaks);

        setSaving(false);
    };

    if (timingsLoading || breaksLoading) {
        return (
            <div className="min-h-screen bg-[#edf2f9] -m-8 p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                    <p className="text-slate-600 font-medium">Loading configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#edf2f9] -m-8 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="relative flex flex-col items-center pt-2 pb-4">
                    <div className="absolute left-0 top-0 pt-2">
                        <Link to="/dashboard/manage-data">
                            <Button variant="ghost" className="text-slate-500 hover:text-slate-700 text-lg font-medium gap-2 pl-0 hover:bg-transparent transition-colors">
                                <ArrowLeft className="h-5 w-5" /> Back
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="border-[1.5px] border-blue-400/40 bg-white px-10 py-3 rounded-xl shadow-sm">
                            <h1 className="text-3xl font-bold text-[#2d3748] tracking-tight text-center">Time & Schedule Configuration</h1>
                        </div>
                        <p className="text-slate-500 text-lg font-medium text-center">
                            Define your institution's daily timeline, period structure, and break rules.
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Configuration Forms - 7 Columns */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* College Hours & Period Structure */}
                        <Card className="bg-white rounded-[2rem] border-none shadow-xl shadow-blue-900/5 overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                                <div className="flex items-center gap-3 text-blue-600">
                                    <Timer className="h-6 w-6" />
                                    <h2 className="text-xl font-bold">Base Schedule & Periods</h2>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-slate-600 font-bold flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-blue-400" /> College Start
                                        </Label>
                                        <Input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="h-14 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-blue-500 text-lg font-mono"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-slate-600 font-bold flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-blue-400" /> College End
                                        </Label>
                                        <Input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="h-14 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white focus:ring-blue-500 text-lg font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6 pt-4">
                                    <div className="space-y-3">
                                        <Label className="text-slate-600 font-bold">Number of Periods</Label>
                                        <Input
                                            type="number"
                                            value={numPeriods}
                                            onChange={(e) => setNumPeriods(parseInt(e.target.value))}
                                            className="h-12 border-slate-200 rounded-xl bg-slate-50"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-slate-600 font-bold">Duration (mins)</Label>
                                        <Input
                                            type="number"
                                            value={periodDuration}
                                            onChange={(e) => setPeriodDuration(parseInt(e.target.value))}
                                            className="h-12 border-slate-200 rounded-xl bg-slate-50"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-slate-600 font-bold">Gap Between (mins)</Label>
                                        <Input
                                            type="number"
                                            value={breakGap}
                                            onChange={(e) => setBreakGap(parseInt(e.target.value))}
                                            className="h-12 border-slate-200 rounded-xl bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Break Management */}
                        <Card className="bg-white rounded-[2rem] border-none shadow-xl shadow-blue-900/5 overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-3 text-orange-600">
                                    <Coffee className="h-6 w-6" />
                                    <h2 className="text-xl font-bold">Break Configuration</h2>
                                </div>
                                <Button onClick={addBreak} variant="outline" className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 gap-2">
                                    <Plus className="h-4 w-4" /> Add Break
                                </Button>
                            </CardHeader>
                            <CardContent className="p-8 space-y-4">
                                {breaks.map((brk) => (
                                    <div key={brk.id} className="flex items-center gap-4 bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 group transition-all hover:border-orange-200">
                                        <div className="flex-1 space-y-2">
                                            <Input
                                                value={brk.name}
                                                onChange={(e) => updateBreak(brk.id, 'name', e.target.value)}
                                                className="border-none bg-transparent font-bold text-slate-700 h-8 p-0 focus-visible:ring-0 text-lg"
                                            />
                                            <div className="flex items-center gap-4 font-mono text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <span>Start:</span>
                                                    <Input
                                                        type="time"
                                                        value={brk.start}
                                                        onChange={(e) => updateBreak(brk.id, 'start', e.target.value)}
                                                        className="h-8 w-24 border-slate-200 rounded-lg p-1 text-xs"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>End:</span>
                                                    <Input
                                                        type="time"
                                                        value={brk.end}
                                                        onChange={(e) => updateBreak(brk.id, 'end', e.target.value)}
                                                        className="h-8 w-24 border-slate-200 rounded-lg p-1 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`capitalize ${brk.type === 'lunch' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                            {brk.type}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeBreak(brk.id)}
                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Visual Preview & Lab Config - 5 Columns */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Visual Day Schedule */}
                        <Card className="bg-[#1a202c] rounded-[2rem] border-none shadow-2xl p-8 text-white h-fit">
                            <CardTitle className="text-xl font-bold mb-8 flex items-center gap-2">
                                <LayoutList className="h-5 w-5 text-blue-400" />
                                Visual Day Schedule
                            </CardTitle>
                            <div className="space-y-10 relative pb-4">
                                {/* Time Markers */}
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
                                    <span>{startTime}</span>
                                    <span>{endTime}</span>
                                </div>

                                {/* Timeline Bar */}
                                <div className="h-20 w-full bg-slate-800/50 rounded-2xl flex overflow-hidden ring-4 ring-slate-900/50 shadow-inner group">
                                    {(() => {
                                        const parseTime = (t: string) => {
                                            const [h, m] = t.split(':').map(Number);
                                            return h * 60 + m;
                                        };

                                        const startMins = parseTime(startTime);
                                        const endMins = parseTime(endTime);
                                        const totalMins = endMins - startMins;

                                        if (totalMins <= 0) return <div className="flex-1 flex items-center justify-center text-xs text-red-400">Invalid Time Range</div>;

                                        const elements: React.ReactNode[] = [];
                                        let currentCursor = startMins;

                                        // periods
                                        for (let i = 0; i < numPeriods; i++) {
                                            // Check for breaks at current position
                                            const activeBreak = breaks.find(b => parseTime(b.start) >= currentCursor - 2 && parseTime(b.start) <= currentCursor + 2);

                                            if (activeBreak) {
                                                const breakStart = parseTime(activeBreak.start);
                                                const breakEnd = parseTime(activeBreak.end);
                                                const breakDuration = breakEnd - breakStart;
                                                const width = (breakDuration / totalMins) * 100;

                                                elements.push(
                                                    <div
                                                        key={`break-${activeBreak.id}`}
                                                        style={{ width: `${width}%` }}
                                                        className="bg-[#ff8a3d] h-full flex items-center justify-center border-r border-black/20"
                                                    >
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger><Coffee className="h-3 w-3 text-white" /></TooltipTrigger>
                                                                <TooltipContent>{activeBreak.name} ({activeBreak.start}-{activeBreak.end})</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                );
                                                currentCursor = breakEnd;
                                            }

                                            // Period width
                                            const pWidth = (periodDuration / totalMins) * 100;
                                            elements.push(
                                                <div
                                                    key={`period-${i}`}
                                                    style={{ width: `${pWidth}%` }}
                                                    className="bg-blue-600 h-full flex items-center justify-center border-r border-black/20 group-hover:bg-blue-500 transition-colors"
                                                >
                                                    <span className="text-[10px] font-bold">{i + 1}</span>
                                                </div>
                                            );
                                            currentCursor += periodDuration + (breakGap || 0);

                                            // Break gap width
                                            if (breakGap > 0 && i < numPeriods - 1) {
                                                const gapWidth = (breakGap / totalMins) * 100;
                                                elements.push(<div key={`gap-${i}`} style={{ width: `${gapWidth}%` }} className="bg-slate-700/30 h-full" />);
                                            }
                                        }

                                        return elements;
                                    })()}
                                </div>

                                {/* Legend */}
                                <div className="flex flex-wrap gap-6 pt-4 justify-center">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <div className="h-3 w-3 bg-blue-600 rounded-full" /> Lecture (Blue)
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <div className="h-3 w-3 bg-[#ff8a3d] rounded-full" /> Break (Orange)
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <div className="h-3 w-3 bg-emerald-500 rounded-full" /> Lab (Green)
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Lab & Save Card */}
                        <Card className="bg-white rounded-[2rem] border-none shadow-xl shadow-blue-900/5 overflow-hidden">
                            <CardContent className="p-10 space-y-10">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 text-emerald-600">
                                        <FlaskConical className="h-6 w-6" />
                                        <h2 className="text-xl font-bold">Lab Timing</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-slate-600 font-bold">Lab Duration (continuous periods)</Label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {[1, 2, 3, 4].map((n) => (
                                                <Button
                                                    key={n}
                                                    variant={labDuration === n ? 'default' : 'outline'}
                                                    onClick={() => setLabDuration(n)}
                                                    className={`h-12 rounded-xl text-lg font-bold ${labDuration === n ? 'bg-emerald-600' : 'border-emerald-100 text-emerald-600'}`}
                                                >
                                                    {n}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-xl font-black shadow-2xl shadow-blue-600/30 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-3 h-7 w-7 animate-spin" /> SAVING...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-3 h-7 w-7" /> SAVE & APPLY TIMINGS
                                        </>
                                    )}
                                </Button>
                                <p className="text-xs text-slate-400 text-center font-medium uppercase tracking-widest">
                                    Timings will be updated across all Student & Faculty dashboards instantly.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchedulingRules;
