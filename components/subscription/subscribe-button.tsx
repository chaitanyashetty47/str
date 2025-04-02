"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { loadRazorpayScript, openRazorpayCheckout } from '@/utils/razorpay';
import { useToast } from '@/components/ui/use-toast';

interface SubscribeButtonProps {
  planId: string;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
}

export function SubscribeButton({
  planId,
  buttonText = 'Subscribe',
  className = '',
  variant = 'default'
}: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscription = async () => {
    try {
      setIsLoading(true);
      
      // Load the Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      
      if (!scriptLoaded) {
        toast({
          title: 'Error',
          description: 'Failed to load payment gateway script',
          variant: 'destructive',
        });
        return;
      }
      
      // Import dynamically to avoid server/client module issues
      const { createUserSubscription } = await import('@/actions/user-subscription.action');
      const subscriptionDetails = await createUserSubscription(planId);
      
      if (subscriptionDetails.error) {
        throw new Error(subscriptionDetails.error);
      }
      
      // Open the Razorpay checkout form
      openRazorpayCheckout({
        key: subscriptionDetails.key,
        subscription_id: subscriptionDetails.subscriptionId,
        name: subscriptionDetails.name,
        description: subscriptionDetails.description,
        amount: subscriptionDetails.amount,
        currency: subscriptionDetails.currency,
        prefill: subscriptionDetails.prefill,
        notes: subscriptionDetails.notes,
        handler: function(response: any) {
          // Handle successful payment
          if (response.razorpay_payment_id) {
            toast({
              title: 'Success!',
              description: 'Your subscription has been activated successfully.',
              duration: 5000,
            });
            
            // Optional: Redirect to a success page or reload the current page
            // window.location.href = '/subscriptions';
          }
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            // User closed the payment window without completing payment
            toast({
              title: 'Payment Cancelled',
              description: 'You closed the payment window without completing the process.',
              variant: 'destructive',
            });
          },
        },
      });
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process subscription',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSubscription}
      className={className}
      variant={variant}
      disabled={isLoading}
    >
      {isLoading ? 'Processing...' : buttonText}
    </Button>
  );
} 