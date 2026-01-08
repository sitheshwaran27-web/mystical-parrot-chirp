"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { showSuccess } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: { role: string | null; class_name: string | null; first_name: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ role: string | null; class_name: string | null; first_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        const profileData = await fetchProfile(initialSession.user.id);
        setProfile(profileData);
        
        if (location.pathname === '/login' || location.pathname === '/') {
          if (profileData?.role === 'admin' || profileData?.role === 'faculty') {
            navigate('/dashboard/faculty');
          } else {
            navigate('/student-dashboard');
          }
        }
      }
      setLoading(false);
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
          
          if (event === 'SIGNED_IN') {
            if (profileData?.role === 'admin' || profileData?.role === 'faculty') {
              navigate('/dashboard/faculty');
            } else {
              navigate('/student-dashboard');
            }
          }
        } else {
          setProfile(null);
          if (event === 'SIGNED_OUT') {
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
    await supabase.auth.signOut();
    showSuccess('Successfully signed out.');
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