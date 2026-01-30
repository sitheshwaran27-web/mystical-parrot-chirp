
import React from 'react';
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AbsenceList from "@/components/absence/AbsenceList";
import SubstitutionManager from "@/components/absence/SubstitutionManager";

export default function AbsenceManagement() {
    return (
        <DashboardLayout>
            <div className="container mx-auto py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Faculty Absence Manager</h1>
                    <p className="text-muted-foreground mt-1">Report absences and manage substitute assignments.</p>
                </div>

                <Tabs defaultValue="absences" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="absences">Absence Requests</TabsTrigger>
                        <TabsTrigger value="substitutions">Substitution Manager</TabsTrigger>
                    </TabsList>

                    <TabsContent value="absences">
                        <AbsenceList />
                    </TabsContent>

                    <TabsContent value="substitutions">
                        <SubstitutionManager />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
