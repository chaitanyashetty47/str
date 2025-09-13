'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'; // Use your existing path
import { decodeJWT } from '@/lib/auth-utils';
import type { AuthUser } from '@/types/auth';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isClient: boolean;
  isTrainer: boolean;
  isAdmin: boolean;
  isPasswordRecovery: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('AuthContext - Auth state change:', event);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        // Handle password recovery events
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        } else if (event === 'SIGNED_OUT') {
          setIsPasswordRecovery(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (session?.access_token && user) {
      const claims = decodeJWT(session.access_token);
      
      if (claims) {
        setAuthUser({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name, // Use name from auth metadata
          role: claims.user_role,
          subscriptions: claims.subscriptions,
          profileCompleted: claims.profile_completed,
        });
      }
    } else {
      setAuthUser(null);
    }
  }, [session, user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: authUser,
        supabaseUser: user,
        session,
        loading,
        isAuthenticated: !!authUser,
        isClient: authUser?.role === 'CLIENT',
        isTrainer: authUser?.role === 'TRAINER',
        isAdmin: authUser?.role === 'ADMIN',
        isPasswordRecovery,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}