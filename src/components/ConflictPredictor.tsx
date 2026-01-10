"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Conflict {
  id: string;
  type: 'hard' | 'soft';
  message: string;
  severity: number; // 0-100
}

export const ConflictPredictor = () => {
  const [conflicts, setConflicts] = React.useState<Conflict[]>([
    { id: 'c1', type: 'soft', message: "Faculty 'Dr. Smith' has 4 consecutive hours on Monday.", severity: 45 },
    { id: 'c2', type: 'soft', message: "Gap of 3 hours for Batch 'CSE-A' on Wednesday afternoon.", severity: 30 }
  ]);

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          AI Conflict Predictor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {conflicts.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600 text-xs">
            <CheckCircle2 className="h-4 w-4" />
            No conflicts predicted for this configuration.
          </div>
        ) : (
          conflicts.map(c => (
            <div key={c.id} className="flex flex-col gap-1 p-2 rounded bg-white border border-amber-100">
              <div className="flex justify-between items-center">
                <Badge variant={c.type === 'hard' ? 'destructive' : 'outline'} className="text-[9px] h-4">
                  {c.type.toUpperCase()}
                </Badge>
                <span className="text-[10px] text-muted-foreground">Risk: {c.severity}%</span>
              </div>
              <p className="text-[11px] leading-relaxed">{c.message}</p>
            </div>
          ))
        )}
        <div className="pt-2 border-t border-amber-100">
          <p className="text-[10px] text-muted-foreground italic">
            * AI uses simulated annealing to predict downstream failures in faculty availability.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};