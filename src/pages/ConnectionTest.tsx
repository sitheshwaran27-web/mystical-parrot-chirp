import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Wifi } from 'lucide-react';

const ConnectionTest = () => {
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [latency, setLatency] = useState<number | null>(null);

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const runTest = async () => {
        setStatus('testing');
        setLogs([]);
        setLatency(null);
        addLog("Starting connection test...");

        const start = performance.now();
        try {
            // Test 1: Raw Fetch (reachability check)
            addLog("Test 1: Attempting reachability check (raw fetch to API)...");
            const fetchStart = performance.now();
            // We'll try to fetch the base URL. If it fails, network might be blocking it.
            const fetchRes = await fetch('https://bcfkkrfrzutbmhdbosaa.supabase.co', { mode: 'no-cors' });
            const fetchEnd = performance.now();
            addLog(`Server reached in ${Math.round(fetchEnd - fetchStart)}ms (Success)`);

            // Test 2: Auth Session
            addLog("Test 2: Attempting to fetch Supabase session via Client Library...");
            const authStart = performance.now();
            const { data, error } = await supabase.auth.getSession();
            const authEnd = performance.now();

            const duration = Math.round(authEnd - authStart);
            setLatency(duration);

            if (error) {
                throw error;
            }

            addLog(`Success! Session fetch took ${duration}ms`);
            addLog(`Session info: ${data.session ? 'Active' : 'No active session'}`);

            setStatus('success');
        } catch (err: any) {
            console.error(err);
            addLog(`ERROR: ${err.message || JSON.stringify(err)}`);
            if (err.message === "Failed to fetch") {
                addLog("CAUTION: 'Failed to fetch' often means a Firewall, AdBlocker, or DNS issue is blocking the Supabase domain.");
            }
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Background Shapes */}
            <div className="absolute top-0 right-0 w-[60%] h-[70%] bg-gradient-to-bl from-indigo-200 to-transparent opacity-20 rounded-bl-[200px] -z-10 blur-3xl" />

            <Card className="w-full max-w-md border-0 shadow-2xl relative z-10">
                <CardHeader className="text-center pb-2">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-sm">
                        <Wifi className="h-7 w-7 text-indigo-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Network Diagnostics
                    </CardTitle>
                    <CardDescription className="text-gray-500">Checking your connection to the scheduling server</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    <div className={`p-5 rounded-xl flex items-center justify-between border-2 transition-all ${status === 'success' ? 'bg-green-50 border-green-100' :
                        status === 'error' ? 'bg-red-50 border-red-100' :
                            'bg-white border-gray-100'
                        }`}>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Current State</span>
                            <span className={`font-bold text-lg ${status === 'success' ? 'text-green-700' : status === 'error' ? 'text-red-700' : 'text-gray-700'}`}>
                                {status === 'idle' && 'Ready to Scan'}
                                {status === 'testing' && 'Analyzing...'}
                                {status === 'success' && 'Connection Active'}
                                {status === 'error' && 'Connection Blocked'}
                            </span>
                        </div>
                        {status === 'testing' && <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />}
                        {status === 'success' && <div className="p-2 bg-green-100 rounded-full"><CheckCircle className="h-6 w-6 text-green-600" /></div>}
                        {status === 'error' && <div className="p-2 bg-red-100 rounded-full"><XCircle className="h-6 w-6 text-red-600" /></div>}
                    </div>

                    {latency !== null && (
                        <div className="flex items-center justify-between px-2">
                            <span className="text-sm font-medium text-gray-500">Server Latency</span>
                            <span className={`font-mono font-bold ${latency < 500 ? 'text-green-600' : latency < 1500 ? 'text-orange-500' : 'text-red-500'}`}>
                                {latency}ms
                            </span>
                        </div>
                    )}

                    <div className="bg-gray-900 text-indigo-300 p-4 rounded-xl text-[10px] font-mono h-48 overflow-y-auto space-y-1.5 shadow-inner border border-gray-800">
                        {logs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-600 italic">
                                Ready for signal analysis...
                            </div>
                        ) : (
                            logs.map((log, i) => <div key={i} className="leading-relaxed border-l-2 border-indigo-500/20 pl-2">{log}</div>)
                        )}
                    </div>

                    <div className="space-y-3 pt-2">
                        <Button onClick={runTest} disabled={status === 'testing'} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                            {status === 'testing' ? 'Diagnosing...' : 'Start New Connection Test'}
                        </Button>

                        <Button variant="outline" className="w-full h-11 border-gray-200 text-gray-600 font-medium" onClick={() => window.location.href = '/login'}>
                            Return to Login
                        </Button>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100/50">
                        <h4 className="text-xs font-bold text-indigo-900 mb-2 uppercase tracking-tight">Troubleshooting Tips:</h4>
                        <ul className="text-[11px] text-indigo-700 space-y-1.5 list-disc pl-4">
                            <li>Try opening this page in <strong>Incognito/Private</strong> mode.</li>
                            <li>Disable <strong>AdBlockers</strong> or VPNs if they are active.</li>
                            <li>Check your browser's <strong>Console</strong> (F12) for detailed errors.</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ConnectionTest;
