'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ResendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onResendSuccess: () => void;
}

export function ResendEmailModal({ isOpen, onClose, email, onResendSuccess }: ResendEmailModalProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emailInput, setEmailInput] = useState(email);

  const handleResendEmail = async () => {
    if (!emailInput.trim()) {
      setResendMessage({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    setIsResending(true);
    setResendMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailInput.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/confirm-email`
        }
      });

      if (error) {
        setResendMessage({ type: 'error', message: error.message });
      } else {
        setResendMessage({ type: 'success', message: 'Confirmation email sent successfully! Check your inbox.' });
        // Call the success callback to update parent state
        onResendSuccess();
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      setResendMessage({ type: 'error', message: 'Failed to send confirmation email. Please try again.' });
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    if (!isResending) {
      setResendMessage(null);
      setEmailInput(email); // Reset to original email
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#F31818]" />
            Resend Confirmation Email
          </DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you a new confirmation link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resend-email">Email Address</Label>
            <Input
              id="resend-email"
              type="email"
              placeholder="Enter your email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full"
              disabled={isResending}
            />
          </div>

          {resendMessage && (
            <Alert className={resendMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {resendMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Mail className="w-4 h-4 text-red-600" />
              )}
              <AlertDescription className={resendMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {resendMessage.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleResendEmail}
              disabled={isResending || !emailInput.trim()}
              className="flex-1 bg-[#F31818] hover:bg-[#F31818]/90 rounded-full"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Again
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isResending}
              className="flex-1 rounded-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}










