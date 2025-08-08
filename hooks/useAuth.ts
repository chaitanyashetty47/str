'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'; // Use your existing path
import { decodeJWT, getTrainerCategory, hasAdminAccess, isTrainerRole } from '@/lib/auth-utils';
import type { AuthUser, UserRole, TrainerCategory } from '@/types/auth';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
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
          role: claims.user_role,
          subscriptions: claims.subscriptions,
          platformAccess: claims.platform_access,
          profileCompleted: claims.profile_completed,
          trainerCategory: getTrainerCategory(claims.user_role),
        });
      }
    } else {
      setAuthUser(null);
    }
  }, [session, user]);

  return {
    user: authUser,
    supabaseUser: user,
    session,
    loading,
    isAuthenticated: !!authUser,
    isClient: authUser?.role === 'CLIENT',
    isTrainer: authUser ? isTrainerRole(authUser.role) : false,
    isFitnessTrainer: authUser?.role === 'FITNESS_TRAINER' || authUser?.role === 'FITNESS_TRAINER_ADMIN' || authUser?.role === 'TRAINER',
    isPsychologyTrainer: authUser?.role === 'PSYCHOLOGY_TRAINER',
    isManifestationTrainer: authUser?.role === 'MANIFESTATION_TRAINER',
    isAdmin: authUser?.role === 'ADMIN',
    hasAdminAccess: authUser ? hasAdminAccess(authUser.role) : false,
    trainerCategory: authUser?.trainerCategory,
    platformAccess: authUser?.platformAccess,
  };
}