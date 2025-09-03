'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'expired' | 'error'>('loading');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (!token || type !== 'signup') {
        setStatus('error');
        return;
      }

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          // Check if it's an expired token error
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setStatus('expired');
          } else {
            setStatus('error');
          }
        } else {
          setStatus('success');
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, router]);

  const handleResendEmail = async () => {
    if (!email) {
      setResendMessage({ type: 'error', message: 'Please enter your email address' });
      return;
    }

    setIsResending(true);
    setResendMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`
        }
      });

      if (error) {
        setResendMessage({ type: 'error', message: error.message });
      } else {
        setResendMessage({ type: 'success', message: 'Confirmation email sent successfully! Check your inbox.' });
        setStatus('expired'); // Reset to expired state to show the form
      }
    } catch (error) {
      setResendMessage({ type: 'error', message: 'Failed to send confirmation email. Please try again.' });
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#F31818]" />
            <h2 className="text-2xl font-bold">Verifying your email...</h2>
            <p className="text-gray-600">Please wait while we confirm your account.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 mx-auto text-[#00D115]" />
            <h2 className="text-3xl font-bold text-[#00D115]">Email Confirmed!</h2>
            <p className="text-gray-600 text-lg">
              Your account has been successfully verified. You'll be redirected to your dashboard shortly.
            </p>
            <div className="pt-4">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="bg-[#F31818] hover:bg-[#F31818]/90 rounded-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <XCircle className="w-16 h-16 mx-auto text-[#F31818]" />
              <h2 className="text-3xl font-bold text-[#F31818]">Link Expired</h2>
              <p className="text-gray-600 text-lg">
                The confirmation link has expired or is invalid. Don't worry, we can send you a new one!
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button
                onClick={handleResendEmail}
                disabled={isResending || !email}
                className="w-full bg-[#F31818] hover:bg-[#F31818]/90 rounded-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Confirmation Email
                  </>
                )}
              </Button>

              {resendMessage && (
                <Alert className={resendMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <AlertDescription className={resendMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {resendMessage.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Still having trouble? Try signing up again or contact support.
              </p>
              <div className="space-x-4">
                <Button variant="outline" asChild>
                  <Link href="/sign-up">Sign Up Again</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <XCircle className="w-16 h-16 mx-auto text-[#F31818]" />
            <h2 className="text-3xl font-bold text-[#F31818]">Something went wrong</h2>
            <p className="text-gray-600 text-lg">
              We encountered an error while verifying your email. Please try again or contact support.
            </p>
            <div className="pt-4 space-x-4">
              <Button variant="outline" asChild>
                <Link href="/sign-up">Try Again</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F31818]/5 via-[#00D115]/5 to-[#0D97FF]/5">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image 
            src="/strentor.png" 
            alt="Strentor Logo" 
            width={120} 
            height={96} 
            className="mx-auto w-24 h-20"
          />
        </div>

        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold">Email Confirmation</CardTitle>
            <CardDescription>
              {status === 'loading' && 'Verifying your account...'}
              {status === 'success' && 'Your account is now verified!'}
              {status === 'expired' && 'Let\'s get you verified'}
              {status === 'error' && 'We need to fix something'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderContent()}
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-600">
            <Link href="/sign-in" className="text-[#F31818] hover:underline font-medium">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}










