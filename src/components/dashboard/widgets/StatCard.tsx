
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    className?: string;
    color?: "blue" | "purple" | "green" | "orange";
}

export function StatCard({ title, value, icon, trend, trendUp, className, color = "blue" }: StatCardProps) {
    const colorStyles = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        purple: "text-purple-600 bg-purple-50 border-purple-100",
        green: "text-green-600 bg-green-50 border-green-100",
        orange: "text-orange-600 bg-orange-50 border-orange-100",
    };

    return (
        <Card className={cn("border-0 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden", className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                    <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
                        <span className="text-3xl font-bold text-gray-900">{value}</span>
                        {trend && (
                            <span className={cn("text-xs font-medium", trendUp ? "text-green-600" : "text-red-500")}>
                                {trend}
                            </span>
                        )}
                    </div>
                    {icon && (
                        <div className={cn("p-3 rounded-xl", colorStyles[color])}>
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
