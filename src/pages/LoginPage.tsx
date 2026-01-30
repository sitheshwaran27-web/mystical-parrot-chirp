import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, profile, loading: sessionLoading } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!sessionLoading && session) {
      // SessionContext will handle redirect
    }
  }, [session, sessionLoading, navigate]);

  const onSubmit = async (data: LoginFormInputs) => {
    console.log("Login attempt started for:", data.email);
    try {
      // Create a timeout promise that resolves with an error after 15 seconds
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve({ data: null, error: { message: "Request timed out" } }), 30000);
      });

      // Race the login request against the timeout
      const result = await Promise.race([
        supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        }),
        timeoutPromise
      ]) as any;

      const { data: authData, error } = result;

      console.log("Login response received:", { authData, error });

      if (error) {
        console.error("Login error:", error);
        let errorMessage = error.message;
        if (errorMessage === "Failed to fetch" || errorMessage === "Request timed out") {
          errorMessage = "Network error: The server is taking too long to respond. Please check your internet connection.";
        }
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        console.log("Login successful, session:", authData.session);
        toast({
          title: "Login Successful",
          description: "Redirecting to your dashboard...",
        });
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white relative overflow-hidden">
      {/* Decorative Background Shapes */}
      <div className="absolute top-0 right-0 w-[60%] h-[70%] bg-gradient-to-bl from-purple-600 via-blue-500 to-transparent opacity-10 rounded-bl-[200px] -z-10 pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[50%] bg-gradient-to-tr from-blue-400 to-transparent opacity-10 rounded-tr-[150px] -z-10 pointer-events-none blur-3xl" />

      <svg className="absolute top-0 right-0 -z-10 w-1/2 h-full text-indigo-50/50" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M50 0 C60 20 80 20 90 10 L100 0 L100 100 L0 100 C20 80 40 80 50 100 Z" fill="url(#gradient)" />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 0.1 }} />
            <stop offset="100%" style={{ stopColor: '#9333ea', stopOpacity: 0.2 }} />
          </linearGradient>
        </defs>
      </svg>

      <div className="container mx-auto flex items-center justify-center min-h-screen p-8">

        {/* Login Form */}
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl shadow-indigo-100/50 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                T
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    className="bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 h-11 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Connection Help</p>
                      <Link
                        to="/test-connection"
                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                      >
                        Run Diagnostics
                      </Link>
                    </div>

                    {/* Debug Panel */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Internal Engine Status</p>
                      <div className="space-y-1 text-[9px] font-mono text-gray-500">
                        <div className="flex justify-between">
                          <span>Session:</span>
                          <span className={session ? "text-green-600 font-bold" : "text-amber-600"}>{session ? "ACTIVE" : "NONE"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>User ID:</span>
                          <span className="text-gray-700 truncate max-w-[150px]">{session?.user?.id || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Profile:</span>
                          <span className={profile ? "text-green-600 font-bold" : "text-amber-600"}>{profile ? profile.role?.toUpperCase() : "FETCHING/NULL"}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 mt-3 text-[9px] text-indigo-600 hover:bg-white hover:text-indigo-800 border border-indigo-100"
                        onClick={async () => {
                          if (profile?.role) {
                            navigate(profile.role === 'student' ? '/student-dashboard' : '/dashboard');
                          } else if (session?.user) {
                            // Self-heal: Create a default profile if missing
                            console.log("LoginPage: Attempting profile self-heal...");
                            const { error } = await supabase.from('profiles').insert({
                              id: session.user.id,
                              role: 'faculty', // Default to faculty, admin can change later
                              first_name: session.user.email?.split('@')[0] || 'User'
                            });

                            if (error) {
                              toast({ title: "Healing Failed", description: error.message, variant: "destructive" });
                            } else {
                              toast({ title: "Profile Healed", description: "Reloading to sync..." });
                              window.location.reload();
                            }
                          } else {
                            localStorage.clear();
                            window.location.reload();
                          }
                        }}
                      >
                        {profile?.role ? "Force Entry &rarr;" : session ? "Heal My Profile" : "Clear Cache & Reload"}
                      </Button>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <p className="text-[10px] text-amber-700 leading-normal mb-2">
                        Stuck on "Signing In"? Your browser might have a corrupted session state.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-[10px] border-amber-200 text-amber-700 hover:bg-amber-100"
                        onClick={() => {
                          localStorage.clear();
                          sessionStorage.clear();
                          window.location.reload();
                        }}
                      >
                        Emergency Reset (Clear Cache)
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;