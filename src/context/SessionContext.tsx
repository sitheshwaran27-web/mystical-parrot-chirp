"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { showSuccess } from '@/utils/toast';
import { useToast } from '@/hooks/use-toast';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: { role: string | null; class_name: string | null; first_name: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ role: string | null; class_name: string | null; first_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = React.useRef(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const syncSetLoading = (val: boolean) => {
    setLoading(val);
    loadingRef.current = val;
  };

  const fetchProfile = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role, class_name, first_name')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
      return null;
    }
    return profileData;
  };

  useEffect(() => {
    const initSession = async () => {
      console.log("SessionContext: Starting initSession...");
      const timeoutId = setTimeout(() => {
        if (loadingRef.current) {
          console.warn("SessionContext: initSession HARD TIMEOUT triggered after 25s");
          syncSetLoading(false);
        }
      }, 25000);

      try {
        console.log("SessionContext: Requesting session (with 20s race)...");

        // Wrap getSession in a 20s timeout race
        const result = (await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("getSession network timeout")), 20000))
        ])) as any;

        const initialSession = result?.data?.session;
        const sessionError = result?.error;

        if (sessionError) {
          console.error("SessionContext: Supabase error", sessionError);
          throw sessionError;
        }

        console.log("SessionContext: initialSession check complete. Has session:", !!initialSession);

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);

          console.log("SessionContext: Fetching profile...");
          const profileData = await Promise.race([
            fetchProfile(initialSession.user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Profile fetch timeout")), 5000))
          ]).catch(err => {
            console.warn("SessionContext: Profile fetch issue", err);
            return null;
          });

          setProfile(profileData as any);
          console.log("SessionContext: Profile loaded:", profileData);

          if (location.pathname === '/login' || location.pathname === '/') {
            const data = profileData as any;
            if (data?.role === 'admin' || data?.role === 'faculty') {
              console.log("SessionContext: Navigating to Admin Dashboard");
              navigate('/dashboard');
            } else if (data?.role === 'student') {
              console.log("SessionContext: Navigating to Student Dashboard");
              navigate('/student-dashboard');
            } else {
              console.warn("SessionContext: No valid role found. Signing out to prevent loop.");
              await supabase.auth.signOut();
              navigate('/login');
            }
          }
        }
      } catch (error) {
        console.error('SessionContext: Initialization failed:', error);
      } finally {
        console.log("SessionContext: initSession cleanup (setting loading: false)");
        clearTimeout(timeoutId);
        syncSetLoading(false);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          console.log("SessionContext: User detected, fetching profile...");
          // Add a timeout to profile fetch in listener too
          const profileData = await Promise.race([
            fetchProfile(currentSession.user.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Profile fetch timeout")), 10000))
          ]).catch(err => {
            console.error("SessionContext: Profile fetch failed in listener", err);
            return null;
          }) as any;

          setProfile(profileData);
          console.log("SessionContext: Profile state updated:", profileData);

          if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && currentSession)) {
            const role = profileData?.role;
            console.log("SessionContext: Evaluating redirect for role:", role);

            if (role === 'admin' || role === 'faculty') {
              console.log("SessionContext: Navigating to Admin Dashboard");
              navigate('/dashboard');
            } else if (role === 'student') {
              console.log("SessionContext: Navigating to Student Dashboard");
              navigate('/student-dashboard');
            } else if (profileData === null) {
              console.error("SessionContext: NO PROFILE FOUND for user", currentSession.user.id);
              toast({
                title: "Profile Missing",
                description: "Your account exists but no profile was found. Please contact an administrator.",
                variant: "destructive"
              });
            } else {
              console.warn("SessionContext: Invalid role detected:", role);
              toast({
                title: "Access Denied",
                description: "Your account does not have a valid role assigned.",
                variant: "destructive"
              });
            }
          }
        } else {
          setProfile(null);
          if (event === 'SIGNED_OUT') {
            console.log("SessionContext: SIGNED_OUT event triggered");
            navigate('/login');
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Explicitly clear state and navigate
      setSession(null);
      setUser(null);
      setProfile(null);
      navigate('/login');
      showSuccess('Successfully signed out.');
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error (e.g. network), we should probably clear local state and force redirect
      setSession(null);
      setUser(null);
      setProfile(null);
      navigate('/login');
    }
  };

  return (
    <SessionContext.Provider value={{ session, user, profile, loading, signOut }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};