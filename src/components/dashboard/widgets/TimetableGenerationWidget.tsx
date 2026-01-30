import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Calendar, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function TimetableGenerationWidget() {
    const [status, setStatus] = useState<'idle' | 'generating' | 'completed' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const { toast } = useToast();

    const handleGenerate = () => {
        setStatus('generating');
        setProgress(0);

        // Mocking the generation progress for demonstration/Viva
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setStatus('completed');
                    toast({
                        title: "Generation Successful",
                        description: "AI has successfully generated a conflict-free timetable.",
                    });
                    return 100;
                }
                return prev + 2;
            });
        }, 100);
    };

    return (
        <Card className="h-full border-0 shadow-lg bg-white rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-gray-50 bg-slate-50/50">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-500" />
                    Time Table Generation
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
                {status === 'idle' && (
                    <>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                            Generate a conflict-free timetable automatically using our advanced AI algorithm. This factors in faculty preferences, room availability, and scheduling rules.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={handleGenerate}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200 h-11"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Timetable
                            </Button>
                            <Button variant="outline" className="flex-1 border-blue-100 text-blue-600 hover:bg-blue-50 h-11">
                                <Calendar className="w-4 h-4 mr-2" />
                                View Suggestions
                            </Button>
                        </div>
                    </>
                )}

                {status === 'generating' && (
                    <div className="py-2 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600 font-bold flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                AI Engine Optimizing...
                            </span>
                            <span className="font-mono font-bold text-slate-500">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-3 bg-blue-50" />
                        <p className="text-xs text-slate-400 italic text-center">
                            Resolving constraints and maximizing faculty satisfaction.
                        </p>
                    </div>
                )}

                {status === 'completed' && (
                    <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-center">
                            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-900 text-lg">Timetable Ready!</h3>
                            <p className="text-sm text-slate-500">The schedule has been optimized and saved.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStatus('idle')} className="flex-1 border-slate-200">
                                Reset
                            </Button>
                            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                                View Timetable
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
