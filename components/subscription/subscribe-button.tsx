"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { loadRazorpayScript, openRazorpayCheckout } from '@/utils/razorpay';
import { toast } from 'sonner';
import { RazorpayResponse } from '@/utils/razorpay';

interface SubscribeButtonProps {
  razorpayPlanId: string;
  selectedCycle: number;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  onSuccess?: () => void;
}

export function SubscribeButton({
  razorpayPlanId,
  selectedCycle,
  buttonText = 'Subscribe',
  className = '',
  variant = 'default',
  onSuccess
}: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<string | null>(null);

  const handleSubscription = async () => {
    try {
      setIsLoading(true);

      // Load the Razorpay script
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway script');
        return;
      }

      // Make an API call to /api/subscriptions/create
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayPlanId, selectedCycle }),
      });

      // Check if the response is not ok (status not in 200-299 range)
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to fetch subscription details');
        return;
      }

      const subscriptionDetails = await response.json();

      if (subscriptionDetails.error) {
        toast.error(subscriptionDetails.error || 'Error fetching subscription details');
        return;
      }

      // Store the subscription ID for potential cleanup
      setCurrentSubscriptionId(subscriptionDetails.subscriptionId);

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
        handler: function (response: RazorpayResponse) {
          (async () => {
            try {
              console.log('Payment successful, verifying...', {
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_payment_id: response.razorpay_payment_id,
                signature_provided: !!response.razorpay_signature
              });

          if (!response.razorpay_payment_id || !response.razorpay_subscription_id || !response.razorpay_signature) {
                console.error('Missing payment response data:', response);
                toast.error('Payment data incomplete', {
                  description: 'The payment response is missing required information. Please try again.',
                  duration: 8000,
            });
            return;
          }

              const verificationResponse = await fetch('/api/subscriptions/verify-payment', {
            method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
            body: JSON.stringify({
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
              });

              const verificationData = await verificationResponse.json();
              
              console.log('Verification response:', {
                status: verificationResponse.status,
                statusText: verificationResponse.statusText,
                data: verificationData
              });

              if (verificationResponse.ok && verificationData.status === 'ok') {
                console.log('Payment verification successful:', verificationData);
                toast.success('Payment successful! Your subscription is now active.', {
                  description: 'You can now access all premium features.',
                  duration: 5000,
                });
                
                // Clear the subscription ID since payment was successful
                setCurrentSubscriptionId(null);
                
                // Call success callback or refresh page
                if (onSuccess) {
                  onSuccess();
                } else {
                  window.location.reload();
                }
              } else {
                // Handle different types of verification errors
                let errorMessage = 'Payment verification failed';
                let errorDescription = 'Please contact support if this issue persists.';

                switch (verificationData.errorType) {
                  case 'SIGNATURE_VERIFICATION_FAILED':
                    errorMessage = 'Payment Security Check Failed';
                    errorDescription = 'The payment could not be verified due to a security issue. Your payment may still be processing.';
                    break;
                  case 'SUBSCRIPTION_NOT_FOUND':
                    errorMessage = 'Subscription Not Found';
                    errorDescription = 'The subscription record could not be found. Please try creating a new subscription.';
                    break;
                  case 'MISSING_PARAMETERS':
                    errorMessage = 'Payment Data Incomplete';
                    errorDescription = `Missing required information: ${verificationData.missingFields?.join(', ')}`;
                    break;
                  case 'CONFIGURATION_ERROR':
                    errorMessage = 'Service Configuration Error';
                    errorDescription = 'There is a configuration issue with the payment service. Please contact support.';
                    break;
                  case 'INTERNAL_ERROR':
                    errorMessage = 'Server Error';
                    errorDescription = 'An unexpected error occurred. Please try again in a few minutes.';
                    break;
                  default:
                    if (verificationData.message) {
                      errorDescription = verificationData.message;
                    }
                }

                console.error('Payment verification failed:', {
                  errorType: verificationData.errorType,
                  error: verificationData.error,
                  message: verificationData.message,
                  fullResponse: verificationData
                });

                toast.error(errorMessage, {
                  description: errorDescription,
                  duration: 8000,
                });
              }
            } catch (error) {
              console.error('Payment verification error:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
              });

              toast.error('Payment verification failed', {
                description: 'There was an error verifying your payment. Please contact support if the issue persists.',
                duration: 8000,
              });
            }
          })();
        },
        modal: {
          ondismiss: async function () {
            console.log('Payment modal dismissed, cleaning up subscription...');
            
            if (currentSubscriptionId) {
              try {
                const cancelResponse = await fetch('/api/subscriptions/cancel', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    subscription_id: currentSubscriptionId,
                    reason: 'USER_CANCELLED'
                  }),
                });

                const cancelData = await cancelResponse.json();
                
                console.log('Subscription cleanup response:', {
                  status: cancelResponse.status,
                  data: cancelData
                });

                if (cancelResponse.ok) {
                  console.log('Subscription cancelled successfully');
                  toast.info('Payment cancelled', {
                    description: 'Your subscription has been cancelled.',
                    duration: 3000,
                  });
                } else {
                  console.error('Failed to cancel subscription:', cancelData);
                  toast.warning('Payment cancelled', {
                    description: 'Payment was cancelled, but there may be a pending subscription. Please check your account.',
                    duration: 5000,
                  });
                }
              } catch (error) {
                console.error('Error cancelling subscription:', {
                  error: error instanceof Error ? error.message : 'Unknown error',
                  subscription_id: currentSubscriptionId
                });
                
                toast.warning('Payment cancelled', {
                  description: 'Payment was cancelled. If you see any pending charges, please contact support.',
                  duration: 5000,
                });
              }
            } else {
              toast.info('Payment cancelled', {
                description: 'No payment was processed.',
                duration: 3000,
              });
            }
            
            setCurrentSubscriptionId(null);
            setIsLoading(false);
          },
        },
      });
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process subscription');
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