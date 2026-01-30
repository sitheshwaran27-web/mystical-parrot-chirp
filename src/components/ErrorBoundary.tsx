
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
                    <div className="max-w-2xl w-full space-y-4">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Something went wrong</AlertTitle>
                            <AlertDescription>
                                An error occurred while rendering the application.
                            </AlertDescription>
                        </Alert>
                        <div className="bg-white p-4 rounded-md shadow-sm border border-red-100 overflow-auto">
                            <h3 className="font-bold text-red-800 mb-2">Error Message:</h3>
                            <pre className="text-sm text-red-600 mb-4 whitespace-pre-wrap">
                                {this.state.error?.toString()}
                            </pre>
                            <h3 className="font-bold text-gray-800 mb-2">Component Stack:</h3>
                            <pre className="text-xs text-gray-500 whitespace-pre-wrap">
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </div>
                        <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                            Reload Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
