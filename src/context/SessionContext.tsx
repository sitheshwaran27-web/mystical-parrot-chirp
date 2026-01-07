"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: { role: string | null; class_name: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ role: string | null; class_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          // Fetch user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role, class_name')
            .eq('id', currentSession.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error('Error fetching profile:', profileError);
            showError('Failed to load user profile.');
            setProfile(null);
          } else if (profileData) {
            setProfile(profileData);
          } else {
            setProfile(null); // No profile found
          }

          // Redirect based on role
          if (profileData?.role === 'admin' || profileData?.role === 'faculty') {
            navigate('/dashboard');
          } else if (profileData?.role === 'student') {
            navigate('/student-dashboard');
          } else {
            // Default to student dashboard if role is not explicitly admin/faculty
            navigate('/student-dashboard');
          }
        } else {
          setProfile(null);
          navigate('/login');
        }
        setLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      if (initialSession?.user) {
        supabase
          .from('profiles')
          .select('role, class_name')
          .eq('id', initialSession.user.id)
          .single()
          .then(({ data: profileData, error: profileError }) => {
            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching initial profile:', profileError);
              showError('Failed to load user profile.');
              setProfile(null);
            } else if (profileData) {
              setProfile(profileData);
            } else {
              setProfile(null);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      showError('Failed to sign out.');
    } else {
      showSuccess('Successfully signed out.');
      setSession(null);
      setUser(null);
      setProfile(null);
      navigate('/login');
    }
    setLoading(false);
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