
import React from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExamConfiguration from "@/components/exams/ExamConfiguration";
import ExamHalls from "@/components/exams/ExamHalls";
import ExamScheduler from "@/components/exams/ExamScheduler";

export default function ExamManagement() {
    return (
        <DashboardLayout>
            <div className="container mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Exam Management</h1>
                    <p className="text-muted-foreground mt-1">Configure exam cycles, halls, and generate timetables.</p>
                </div>

                <Tabs defaultValue="configuration" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="configuration">Exam Configuration</TabsTrigger>
                        <TabsTrigger value="halls">Exam Halls</TabsTrigger>
                        <TabsTrigger value="scheduler">Timetable Scheduler</TabsTrigger>
                    </TabsList>

                    <TabsContent value="configuration">
                        <ExamConfiguration />
                    </TabsContent>

                    <TabsContent value="halls">
                        <ExamHalls />
                    </TabsContent>

                    <TabsContent value="scheduler">
                        <ExamScheduler />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
