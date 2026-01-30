import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
    { name: "Dr. A. Mehta", classes: 12, color: "#ef4444" },
    { name: "Prof. K. Rao", classes: 18, color: "#3b82f6" },
    { name: "Mrs. S. Patel", classes: 14, color: "#f59e0b" },
    { name: "Mr. R. Singh", classes: 22, color: "#10b981" },
    { name: "Dr. T. Gupta", classes: 16, color: "#8b5cf6" },
];

export function WorkloadReportChart() {
    return (
        <Card className="h-full border-0 shadow-sm">
            <CardHeader className="pb-2 border-b border-gray-50">
                <CardTitle className="text-lg font-bold text-gray-800">Faculty Workload Report</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            width={100}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="classes" radius={[0, 4, 4, 0]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
