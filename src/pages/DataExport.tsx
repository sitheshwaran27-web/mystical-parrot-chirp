import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";

const DataExport = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">Export Data</h1>
                    <p className="text-muted-foreground">
                        Download system data and reports in various formats.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Master Schedule</CardTitle>
                        <CardDescription>Complete timetable for all departments</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Faculty Workload</CardTitle>
                        <CardDescription>Detailed workload report for all faculty</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Download CSV
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Student Attendance Sheet</CardTitle>
                        <CardDescription>Blank attendance sheets for classes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DataExport;
