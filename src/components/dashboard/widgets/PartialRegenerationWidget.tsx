
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

export function PartialRegenerationWidget() {
    return (
        <Card className="h-full border-0 shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-50">
                <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-purple-500" />
                    Partial Timetable Regeneration
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Faculty</label>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Faculty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="prof-sharma">Prof. Sharma</SelectItem>
                            <SelectItem value="dr-mehta">Dr. A. Mehta</SelectItem>
                            <SelectItem value="prof-rao">Prof. K. Rao</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Slot</label>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Slot" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mon-1">Monday 1st Period</SelectItem>
                            <SelectItem value="tue-3">Tuesday 3rd Period</SelectItem>
                            <SelectItem value="wed-2">Wednesday 2nd Period</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Slots
                </Button>
            </CardContent>
        </Card>
    );
}
