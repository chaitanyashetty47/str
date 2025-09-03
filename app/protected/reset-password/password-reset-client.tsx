'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface PasswordResetClientProps {
  searchParams: Message;
}

export function PasswordResetClient({ searchParams }: PasswordResetClientProps) {
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check initial session and auth state
    const checkAuthState = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        // No session - redirect to sign in
        router.push('/sign-in?error=Please%20sign%20in%20to%20reset%20your%20password');
        return;
      }

      console.log('Password reset - session found:', currentSession.user?.id);
      setSession(currentSession);
      
      // For direct access, any authenticated session is valid
      setIsPasswordRecovery(true);
      setIsLoading(false);
    };

    checkAuthState();

    // Listen for auth state changes (including PASSWORD_RECOVERY events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        console.log('Auth state change:', event, currentSession?.user?.id);
        
        if (event === 'PASSWORD_RECOVERY') {
          // This is definitely a password recovery session
          setIsPasswordRecovery(true);
          setSession(currentSession);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          // User signed out, redirect to sign-in
          router.push('/sign-in');
        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          // Token refreshed, update session
          setSession(currentSession);
        } else if (currentSession && !isPasswordRecovery) {
          // If we get any session and haven't set password recovery yet, allow it
          setIsPasswordRecovery(true);
          setSession(currentSession);
          setIsLoading(false);
        }
        // Removed the strict "no session" redirect to be more permissive
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F31818]/5 via-[#00D115]/5 to-[#0D97FF]/5">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F31818] mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your password reset request...</p>
          </div>
        </div>
      </div>
    );
  }

  // For direct access, we only need a valid session
  if (!session && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F31818]/5 via-[#00D115]/5 to-[#0D97FF]/5">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-gray-800">Authentication Required</h1>
            <p className="text-gray-600 mb-6">
              You must be signed in to reset your password.
            </p>
            <button
              onClick={() => router.push('/sign-in')}
              className="bg-[#F31818] hover:bg-[#F31818]/90 text-white font-bold py-2 px-4 rounded-lg transition-all"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show password reset form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F31818]/5 via-[#00D115]/5 to-[#0D97FF]/5">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-blue-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Change Password</h1>
          <p className="text-gray-600">
            Enter your new password below to update your account.
          </p>
        </div>
        
        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="font-semibold">New Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="Enter new password"
              required
              className="w-full p-3 border-2 rounded-lg focus:border-[#F31818] transition-colors"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-semibold">Confirm Password</Label>
            <Input
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              required
              className="w-full p-3 border-2 rounded-lg focus:border-[#F31818] transition-colors"
            />
          </div>
          
          <SubmitButton 
            formAction={resetPasswordAction}
            className="w-full bg-[#F31818] hover:bg-[#F31818]/90 text-white font-bold py-3 rounded-lg text-lg transform hover:scale-105 transition-all"
          >
            Change Password
          </SubmitButton>
          
          <FormMessage message={searchParams} />
        </form>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            After changing your password, you'll be redirected to your settings page.
          </p>
        </div>
      </div>
    </div>
  );
}