"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { loadRazorpayScript, openRazorpayCheckout } from '@/utils/razorpay';
import { toast } from 'sonner';
import { RazorpayResponse, RazorpayErrorResponse } from '@/utils/razorpay';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface SubscribeButtonProps {
  razorpayPlanId: string;
  selectedCycle: number;
  buttonText?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
  onSuccess?: () => void;
  retryMode?: boolean;
  existingSubscriptionId?: string;
  userData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export function SubscribeButton({
  razorpayPlanId,
  selectedCycle,
  buttonText = 'Subscribe',
  className = '',
  variant = 'default',
  onSuccess,
  retryMode = false,
  existingSubscriptionId,
  userData
}: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationTimeoutId, setVerificationTimeoutId] = useState<number | null>(null);

  // Enhanced payment failure handler
  const handlePaymentFailure = async (response: RazorpayErrorResponse, subscriptionId: string) => {
    // console.error('Payment failed:', response);
    
    // Extract comprehensive error details
    const errorDetails = {
      code: response.error?.code || 'UNKNOWN_ERROR',
      description: response.error?.description || 'Payment failed',
      source: response.error?.source || 'unknown',
      step: response.error?.step || 'unknown',
      reason: response.error?.reason || 'unknown',
      orderId: response.error?.metadata?.order_id,
      paymentId: response.error?.metadata?.payment_id,
      subscriptionId: response.error?.metadata?.subscription_id
    };

    try {
      // Mark payment as failed in database with comprehensive error details
      const markFailedResponse = await fetch('/api/subscriptions/mark-payment-failed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionId,
          errorDetails: errorDetails
        }),
      });

      if (markFailedResponse.ok) {
        // console.log('Payment marked as failed successfully with comprehensive error details');
        
        // Show user-friendly error message based on error type
        let errorMessage = 'Payment Failed';
        let errorDescription = 'Your payment could not be processed. You can retry the payment.';

        switch (errorDetails.code) {
          case 'BAD_REQUEST_ERROR':
            errorMessage = 'Invalid Payment Details';
            errorDescription = 'Please check your payment information and try again.';
            break;
          case 'GATEWAY_ERROR':
            errorMessage = 'Payment Gateway Error';
            errorDescription = 'There was an issue with the payment gateway. Please try again in a few minutes.';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Network Error';
            errorDescription = 'Please check your internet connection and try again.';
            break;
          case 'SERVER_ERROR':
            errorMessage = 'Server Error';
            errorDescription = 'Our payment server is temporarily unavailable. Please try again later.';
            break;
          case 'VALIDATION_ERROR':
            errorMessage = 'Validation Error';
            errorDescription = 'Please verify your payment details and try again.';
            break;
          default:
            if (errorDetails.description) {
              errorDescription = errorDetails.description;
            }
        }

        toast.error(errorMessage, {
          description: errorDescription,
          duration: 5000,
        });
      } else {
        // console.error('Failed to mark payment as failed');
        toast.error('Payment failed', {
          description: 'Your payment could not be processed. Please try again.',
          duration: 5000,
        });
      }
    } catch (error) {
      // console.error('Error marking payment as failed:', error);
      toast.error('Payment failed', {
        description: 'Your payment could not be processed. Please try again.',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
      setShowVerificationModal(false);
      
      // Clear timeout if it exists
      if (verificationTimeoutId) {
        window.clearTimeout(verificationTimeoutId);
        setVerificationTimeoutId(null);
      }
    }
  };

  // Handle verification timeout - show modal after 2 minutes
  const handleVerificationTimeout = () => {
    setShowVerificationModal(true);
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (verificationTimeoutId) {
        window.clearTimeout(verificationTimeoutId);
      }
    };
  }, [verificationTimeoutId]);

  const handleSubscription = async () => {
    try {
      setIsLoading(true);

      // Load the Razorpay script
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway script');
        return;
      }

      //Check to see if the user has an active subscription (only for new subscriptions, not retries)
      if (!retryMode) {
        try {
          const checkResponse = await fetch('/api/subscriptions/check-existing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ razorpayPlanId }),
          });

          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.hasExistingSubscription) {
              toast.error('Subscription already exists', {
                description: 'You already have an active subscription for this plan.',
                duration: 5000,
              });
              return;
            }
          }
        } catch (error) {
          // console.error('Error checking existing subscription:', error);
          // Continue with subscription creation even if check fails
        }
      }

      // Make an API call to /api/subscriptions/create or use existing subscription for retry
      let response;
      if (retryMode && existingSubscriptionId) {
        // For retry mode, use existing subscription ID with user prefill
        response = {
          ok: true,
          json: async () => ({
            subscriptionId: existingSubscriptionId,
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: 0, // Will be set by Razorpay
            currency: 'INR',
            name: 'Retry Payment',
            description: 'Retrying payment for existing subscription',
            prefill: {
              name: userData?.name || '',
              email: userData?.email || '',
              ...(userData?.phone && { contact: userData.phone })
            },
            notes: {}
          })
        };
      } else {
        // Create new subscription
        response = await fetch('/api/subscriptions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ razorpayPlanId, selectedCycle }),
        });
      }

      // Check if the response is not ok (status not in 200-299 range)
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to fetch subscription details');
        return;
      }

      const subscriptionDetails = await response.json();

      // console.log('Subscription details:', subscriptionDetails);

      if (subscriptionDetails.error) {
        toast.error(subscriptionDetails.error || 'Error fetching subscription details');
        return;
      }

      // Store the subscription ID for potential cleanup
      const subscriptionId = subscriptionDetails.subscriptionId;
      // console.log('Subscription ID in variable:', subscriptionId);
      setCurrentSubscriptionId(subscriptionId);
      // console.log('Current subscription ID:', subscriptionId);


      // Open the Razorpay checkout form and get the instance
      const razorpay = await openRazorpayCheckout({
        key: subscriptionDetails.key,
        subscription_id: subscriptionDetails.subscriptionId,
        name: subscriptionDetails.name,
        description: subscriptionDetails.description,
        amount: retryMode ? 0 : subscriptionDetails.amount, // For retry, let Razorpay determine amount
        currency: subscriptionDetails.currency,
        prefill: subscriptionDetails.prefill,
        notes: subscriptionDetails.notes,
        handler: function (response: RazorpayResponse) {
          (async () => {
            try {
              // console.log('Payment successful, verifying...', {
              //   razorpay_subscription_id: response.razorpay_subscription_id,
              //   razorpay_payment_id: response.razorpay_payment_id,
              //   signature_provided: !!response.razorpay_signature
              // });

          if (!response.razorpay_payment_id || !response.razorpay_subscription_id || !response.razorpay_signature) {
                // console.error('Missing payment response data:', response);
                toast.error('Payment data incomplete', {
                  description: 'The payment response is missing required information. Please try again.',
                  duration: 8000,
            });
            return;
          }

              // Set verification state and show immediate feedback
              setIsVerifying(true);
              setIsLoading(false);
              
              // Show immediate loading toast
              toast.loading('Payment received! Verifying...', {
                id: 'payment-verification',
                description: 'Please wait while we confirm your payment',
                duration: Infinity
              });

              // Set timeout for long verification (2 minutes) - client-side safe
              const timeoutId = window.setTimeout(handleVerificationTimeout, 2 * 60 * 1000);
              setVerificationTimeoutId(timeoutId);

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
              
              // console.log('Verification response:', {
              //   status: verificationResponse.status,
              //   statusText: verificationResponse.statusText,
              //   data: verificationData
              // });

              if (verificationResponse.ok && verificationData.status === 'ok') {
                // console.log('Payment verification successful:', verificationData);
                
                // Clear timeout
                if (verificationTimeoutId) {
                  window.clearTimeout(verificationTimeoutId);
                  setVerificationTimeoutId(null);
                }
                
                // Update loading toast to success
                toast.success('Payment verified! Your subscription is now active.', {
                  id: 'payment-verification',
                  description: 'You can now access all premium features.',
                  duration: 5000,
                });
                
                // Clear the subscription ID since payment was successful
                setCurrentSubscriptionId(null);
                setIsVerifying(false);
                setShowVerificationModal(false);
                
                // Call success callback or refresh page
                if (onSuccess) {
                  onSuccess();
                } else {
                  window.location.reload();
                }
              } else {
                // Clear timeout
                if (verificationTimeoutId) {
                  window.clearTimeout(verificationTimeoutId);
                  setVerificationTimeoutId(null);
                }
                
                // Handle different types of verification errors with enhanced messaging
                let errorMessage = 'Payment verification pending';
                let errorDescription = 'We\'re verifying your payment manually. You\'ll receive confirmation within 10-15 minutes via email.';

                switch (verificationData.errorType) {
                  case 'SIGNATURE_VERIFICATION_FAILED':
                    errorMessage = 'Payment verification pending';
                    errorDescription = 'We\'re manually verifying your payment for security. Please check your email for confirmation within 10-15 minutes.';
                    break;
                  case 'SUBSCRIPTION_NOT_FOUND':
                    errorMessage = 'Subscription verification pending';
                    errorDescription = 'We\'re processing your subscription manually. You\'ll receive confirmation via email within 10-15 minutes.';
                    break;
                  case 'MISSING_PARAMETERS':
                    errorMessage = 'Payment verification pending';
                    errorDescription = 'We\'re manually processing your payment. Please check your email for confirmation within 10-15 minutes.';
                    break;
                  case 'CONFIGURATION_ERROR':
                    errorMessage = 'Payment verification pending';
                    errorDescription = 'We\'re manually verifying your payment. You\'ll receive confirmation via email within 10-15 minutes.';
                    break;
                  case 'INTERNAL_ERROR':
                    errorMessage = 'Payment verification pending';
                    errorDescription = 'We\'re manually processing your payment due to a temporary issue. Please check your email for confirmation within 10-15 minutes.';
                    break;
                  default:
                    errorMessage = 'Payment verification pending';
                    errorDescription = 'We\'re manually verifying your payment. You\'ll receive confirmation via email within 10-15 minutes.';
                }

                // console.error('Payment verification failed:', {
                //   errorType: verificationData.errorType,
                //   error: verificationData.error,
                //   message: verificationData.message,
                //   fullResponse: verificationData
                // });

                // Update loading toast to error with action
                toast.error(errorMessage, {
                  id: 'payment-verification',
                  description: errorDescription,
                  duration: 10000,
                  action: {
                    label: 'Check Status',
                    onClick: () => window.location.reload()
                  }
                });
                
                setIsVerifying(false);
                setShowVerificationModal(false);
              }
            } catch (error) {
              // Clear timeout
              if (verificationTimeoutId) {
                window.clearTimeout(verificationTimeoutId);
                setVerificationTimeoutId(null);
              }
              
              // console.error('Payment verification error:', {
              //   error: error instanceof Error ? error.message : 'Unknown error',
              //   stack: error instanceof Error ? error.stack : undefined,
              //   timestamp: new Date().toISOString()
              // });

              // Update loading toast to error
              toast.error('Payment verification pending', {
                id: 'payment-verification',
                description: 'We\'re manually verifying your payment. Please check your email for confirmation within 10-15 minutes.',
                duration: 10000,
                action: {
                  label: 'Check Status',
                  onClick: () => window.location.reload()
                }
              });
              
              setIsVerifying(false);
              setShowVerificationModal(false);
            }
          })();
        },
        modal: {
          ondismiss: async function () {
            // console.log('Payment modal dismissed, cleaning up subscription...');
            
            // console.log('Current subscription ID in modal:', subscriptionId);
            if (subscriptionId) {
              try {
                const cancelResponse = await fetch('/api/subscriptions/mark-cancelled', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    subscriptionId: subscriptionId,
                    reason: 'USER_CANCELLED'
                  }),
                });

                const cancelData = await cancelResponse.json();
                
                // console.log('Subscription cleanup response:', {
                //   status: cancelResponse.status,
                //   data: cancelData
                // });

                if (cancelResponse.ok) {
                  // console.log('Subscription cancelled successfully');
                  toast.info('Payment cancelled', {
                    description: 'Your subscription has been cancelled.',
                    duration: 3000,
                  });
                } else {
                  // console.error('Failed to cancel subscription:', cancelData);
                  toast.warning('Payment cancelled', {
                    description: 'Payment was cancelled, but there may be a pending subscription. Please check your account.',
                    duration: 5000,
                  });
                }
              } catch (error) {
                // console.error('Error cancelling subscription:', {
                //   error: error instanceof Error ? error.message : 'Unknown error',
                //   subscription_id: subscriptionId
                // });
                
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
          onError: async function (error: any) {
            // console.error('Payment error Failed occurred:', error);
            
            if (subscriptionId) {
              try {
                // Mark payment as failed in database
                const markFailedResponse = await fetch('/api/subscriptions/mark-payment-failed', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    subscriptionId: subscriptionId,
                    error: error.description || error.error?.description || 'Payment failed',
                    failureReason: error.code || error.error?.code || 'Unknown error'
                  }),
                });

                if (markFailedResponse.ok) {
                  // console.log('Payment marked as failed successfully');
                  toast.error('Payment failed', {
                    description: 'Your payment could not be processed. You can retry the payment.',
                    duration: 5000,
                  });
                } else {
                  // console.error('Failed to mark payment as failed');
                }
              } catch (error) {
                // console.error('Error marking payment as failed:', error);
              }
            }
            
            // Clear loading state
            setIsLoading(false);
          },
        },
      });

      // Add payment.failed event listener as recommended by Razorpay
      razorpay.on('payment.failed', function (response: RazorpayErrorResponse) {
        // console.log('Payment failed event triggered:', response);
        handlePaymentFailure(response, subscriptionId);
      });

    } catch (error) {
      // console.error('Subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process subscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleSubscription}
        className={className}
        variant={variant}
        disabled={isLoading || isVerifying}
      >
        {isLoading ? 'Processing...' : isVerifying ? 'Verifying...' : buttonText}
      </Button>

      {/* Verification Modal for Long Delays */}
      <AlertDialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              Payment Verification in Progress
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                Your payment was received successfully, but verification is taking longer than expected.
              </div>
              <div>
                <strong>What's happening?</strong><br />
                We're manually verifying your payment to ensure everything is processed correctly.
              </div>
              <div>
                <strong>What should you do?</strong><br />
                You can safely close this page. We'll email you confirmation within 10-15 minutes.
              </div>
              <div className="text-sm text-muted-foreground">
                If you don't receive confirmation within 15 minutes, please contact our support team.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowVerificationModal(false)}>
              Close Page
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => window.location.reload()}>
              Check Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}