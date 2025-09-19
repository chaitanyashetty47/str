'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Loader2, Crown, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import { SubscribeButton } from './subscribe-button';
import { PricingHeader } from './PricingHeader';
import { getPlanMatrix, PlanMatrixItem } from '@/actions/subscriptions/get-plan-matrix.action';
import { updateSubscription } from '@/actions/subscriptions/update-subscription.action';
import { cancelSubscription } from '@/actions/subscriptions/cancel-subscription.action';
import { useAction } from '@/hooks/useAction';
import { toast } from 'sonner';
import { getUserSubscriptions } from '@/actions/subscriptions/get-user-subscriptions';

interface SettingsPricingSectionProps {
  userId: string;
  onSubscriptionSuccess?: () => void;
}

const billingOptions = [
  { label: "Quarterly", value: 3, discount: 10 },
  { label: "Semi-Annual", value: 6, discount: 20 },
  { label: "Annual", value: 12, discount: 30 },
];

const categoryGradients = {
  FITNESS: "from-blue-500 to-purple-500",
  PSYCHOLOGY: "from-orange-500 to-red-500",
  MANIFESTATION: "from-purple-500 to-pink-500",
  ALL_IN_ONE: "from-green-500 to-emerald-500"
};

const categoryIcons = {
  FITNESS: (
    <div className={`rounded-full bg-gradient-to-r ${categoryGradients.FITNESS} w-10 h-10 flex items-center justify-center flex-shrink-0`}>
      <div className="relative w-6 h-6">
        <Image
          src="/fitness.svg"
          alt="Fitness Training"
          fill
          sizes="24px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  ),
  PSYCHOLOGY: (
    <div className={`rounded-full bg-gradient-to-r ${categoryGradients.PSYCHOLOGY} w-10 h-10 flex items-center justify-center flex-shrink-0`}>
      <div className="relative w-6 h-6">
        <Image
          src="/brains.svg"
          alt="Psychological Support"
          fill
          sizes="24px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  ),
  MANIFESTATION: (
    <div className={`rounded-full bg-gradient-to-r ${categoryGradients.MANIFESTATION} w-10 h-10 flex items-center justify-center flex-shrink-0`}>
      <div className="relative w-6 h-6">
        <Image
          src="/manifestation.png"
          alt="Manifestation Guidance"
          fill
          sizes="24px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  ),
  ALL_IN_ONE: (
    <div className={`rounded-full bg-gradient-to-r ${categoryGradients.ALL_IN_ONE} w-10 h-10 flex items-center justify-center flex-shrink-0`}>
      <Crown className="h-6 w-6 text-white" />
    </div>
  )
};





export function SettingsPricingSection({ 
  userId, 
  onSubscriptionSuccess 
}: SettingsPricingSectionProps) {
  const [plans, setPlans] = useState<PlanMatrixItem[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Confirmation dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanMatrixItem | null>(null);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  const { execute: executeUpdate, isLoading: isUpdating } = useAction(updateSubscription, {
    onSuccess: () => {
      toast.success('Subscription updated successfully!');
      loadPlans(); // Refresh the plans
      onSubscriptionSuccess?.();
    },
    onError: (error) => {
      toast.error(error || 'Failed to update subscription');
    }
  });

  const { execute: executeCancel, isLoading: isCancelling } = useAction(cancelSubscription, {
    onSuccess: () => {
      toast.success('Subscription cancelled successfully!');
      loadPlans(); // Refresh the plans
      onSubscriptionSuccess?.();
    },
    onError: (error) => {
      toast.error(error || 'Failed to cancel subscription');
    }
  });

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await getPlanMatrix({ userId });
      
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setPlans(result.data.plans);
      }
    } catch (err) {
      console.error('Failed to load plan matrix:', err);
      setError('Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [userId]);

  const handlePlanAction = async (plan: PlanMatrixItem) => {
    const { action } = plan;

    switch (action.type) {
      case 'current':
        // Do nothing - it's the current plan
        break;
        
      case 'subscribe':
        // This will be handled by the SubscribeButton component
        break;
        
      case 'retry_payment':
        // Handle retry payment - reuse existing subscription
        if (action.subscriptionId && action.planId) {
          handleRetryPayment(plan, action.subscriptionId);
        }
        break;
        
      case 'upgrade':
      case 'downgrade':
        if (action.subscriptionId && action.planId) {
          setSelectedPlan(plan);
          setConfirmDialogOpen(true);
        }
        break;
        
      case 'cancel_first':
        await handleCancelFirstDialog(plan);
        break;
        
      case 'disabled':
        // Do nothing - button is disabled
        break;
        
      default:
        console.warn('Unknown action type:', action.type);
    }
  };

  const handleCancelFirstDialog = async (targetPlan: PlanMatrixItem) => {
    if (!targetPlan.action.conflictSubscriptions || targetPlan.action.conflictSubscriptions.length === 0) {
      toast.error('No conflicting subscriptions found');
      return;
    }

    // Get user subscriptions to show names
    const result = await getUserSubscriptions({ userId });
    if (result.error) {
      toast.error('Failed to load subscription details');
      return;
    }

    const conflictSubs = result.data?.filter(sub => 
      targetPlan.action.conflictSubscriptions?.includes(sub.id)
    );

    if (!conflictSubs || conflictSubs.length === 0) {
      toast.error('Conflicting subscriptions not found');
      return;
    }

    const confirmMessage = conflictSubs.length === 1 
      ? `To ${targetPlan.action.type === 'upgrade' ? 'upgrade to' : 'subscribe to'} "${targetPlan.name}", you need to cancel your "${conflictSubs[0].plan.name}" subscription first.\n\nDo you want to cancel it now?`
      : `To ${targetPlan.action.type === 'upgrade' ? 'upgrade to' : 'subscribe to'} "${targetPlan.name}", you need to cancel your other active subscriptions first.\n\nCancel ${conflictSubs.map(s => s.plan.name).join(', ')}?`;

    if (confirm(confirmMessage)) {
      // Cancel the first conflicting subscription
      executeCancel({
        userId,
        subscriptionId: conflictSubs[0].id
      });
    }
  };

  const handleRetryPayment = async (plan: PlanMatrixItem, subscriptionId: string) => {
    try {
      // Reset payment status to PENDING for retry
      const resetResponse = await fetch('/api/subscriptions/reset-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionId,
        }),
      });

      if (resetResponse.ok) {
        // Open Razorpay checkout with existing subscription
        // This will be handled by the SubscribeButton component
        // We need to trigger the subscription flow with the existing subscription ID
        toast.success('Payment retry initiated. Please complete your payment.');
        
        // Refresh plans to update the UI
        loadPlans();
      } else {
        toast.error('Failed to initiate payment retry');
      }
    } catch (error) {
      console.error('Error handling retry payment:', error);
      toast.error('Failed to initiate payment retry');
    }
  };

  const handleSubscriptionSuccess = () => {
    loadPlans(); // Refresh the plans
    onSubscriptionSuccess?.();
  };

  const getConfirmationMessage = (currentPlan: PlanMatrixItem | null, newPlan: PlanMatrixItem) => {
    // Check if this is an All-In-One downgrade
    if (currentPlan?.category === 'ALL_IN_ONE' && newPlan.category !== 'ALL_IN_ONE') {
      const lostCategories = ['FITNESS', 'PSYCHOLOGY', 'MANIFESTATION']
        .filter(cat => cat !== newPlan.category)
        .map(cat => cat.toLowerCase())
        .join(' and ');
      
      return `You are downgrading from All-In-One to ${newPlan.name}.
      
You'll lose access to ${lostCategories} features.

Your subscription will be updated immediately and charges will be prorated accordingly.

Are you sure you want to proceed with this downgrade?`;
    }
    
    // Default upgrade/downgrade messages
    if (newPlan.action.type === 'upgrade') {
      return `You are about to upgrade your subscription to ${newPlan.name}.
      
Your subscription will be upgraded immediately and the charges will be prorated accordingly.

Are you sure you want to proceed with this upgrade?`;
    } else {
      return `You are about to downgrade your subscription to ${newPlan.name}.
      
Your subscription will be downgraded immediately and the charges will be prorated accordingly.

Are you sure you want to proceed with this downgrade?`;
    }
  };

  const handleConfirmPlanUpdate = async () => {
    if (!selectedPlan || !selectedPlan.action.subscriptionId || !selectedPlan.action.planId) {
      return;
    }

    setIsUpdatingPlan(true);
    try {
      const response = await fetch('/api/subscriptions/update-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: selectedPlan.action.subscriptionId,
          newPlanId: selectedPlan.action.planId,
          userId: userId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update subscription');
      }

      toast.success('Subscription updated successfully!', {
        description: `Your subscription has been updated to ${selectedPlan.name}`,
      });
      
      setConfirmDialogOpen(false);
      setSelectedPlan(null);
      
      // Refresh the page to show updated subscription
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to update subscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update subscription';
      toast.error('Subscription Update Failed', {
        description: errorMessage,
      });
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Loading Header */}
        <div className="space-y-7 text-center">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <Skeleton className="h-12 w-80 mx-auto rounded-full" />
        </div>
        
        {/* Loading Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="min-h-[280px]">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        {/* Header still shown during error */}
        <PricingHeader
          title="All Subscription Plans"
          subtitle="Choose from quarterly, semi-annual, or annual billing for each category"
          options={billingOptions}
          selected={selectedCycle}
          onSelect={setSelectedCycle}
        />
        
        {/* Error Alert */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }



  // Get category-specific styling
  const getCategoryBorderClass = (category: string) => {
    switch (category) {
      case 'FITNESS': return 'border-blue-200';
      case 'PSYCHOLOGY': return 'border-purple-200';
      case 'MANIFESTATION': return 'border-orange-200';
      case 'ALL_IN_ONE': return 'border-green-200';
      default: return 'border-gray-200';
    }
  };

  const getButtonClassName = (plan: PlanMatrixItem) => {
    const baseClasses = "w-full text-white text-sm font-medium py-2 px-3 min-h-[40px] flex items-center justify-center text-center whitespace-normal break-words";
    
    if (plan.buttonState === 'current') {
      return `${baseClasses} bg-green-500 hover:bg-green-600`;
    }
    if (plan.buttonState === 'payment_verification') {
      return `${baseClasses} bg-yellow-500 hover:bg-yellow-600`;
    }
    if (plan.buttonState === 'retry_payment') {
      return `${baseClasses} bg-strentor-orange hover:bg-strentor-orange/90`;
    }
    if (plan.buttonState === 'resume_subscription') {
      return `${baseClasses} bg-blue-500 hover:bg-blue-600`;
    }
    return `${baseClasses} bg-strentor-red hover:bg-strentor-red/90`;
  };

  const getGridLayout = (planCount: number) => {
    if (planCount === 1) return "grid-cols-1 max-w-sm mx-auto";
    if (planCount === 2) return "grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto";
    if (planCount === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto";
    if (planCount === 4) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto";
    if (planCount === 5) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 max-w-8xl mx-auto";
    if (planCount === 6) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 max-w-9xl mx-auto";
    return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"; // Fallback
  };

  // Filter plans based on selected billing cycle
  const filteredPlans = plans.filter(
    (plan) => plan.billing_cycle === selectedCycle
  );

  return (
    <div id="pricing-section" className="space-y-8">
      {/* Pricing Header with Billing Cycle Tabs */}
      <PricingHeader
        title="All Subscription Plans"
        subtitle="Choose from quarterly, semi-annual, or annual billing for each category"
        options={billingOptions}
        selected={selectedCycle}
        onSelect={setSelectedCycle}
      />

      {/* Single Grid Layout - No Category Grouping */}
      <div className={`grid ${getGridLayout(filteredPlans.length)} gap-4`}>
        {filteredPlans
          .sort((a, b) => {
            // Sort by category only since all plans have the same billing cycle now
            const categoryOrder = ['FITNESS', 'PSYCHOLOGY', 'MANIFESTATION', 'ALL_IN_ONE'];
            return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
          })
          .map((plan) => (
            <Card 
              key={plan.id} 
              className={`h-full flex flex-col overflow-hidden rounded-2xl border p-6 shadow bg-background ${getCategoryBorderClass(plan.category)} ${
                plan.buttonState === 'current' ? 'ring-2 ring-green-500' : ''
              }`}
            >
              {/* Header Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {categoryIcons[plan.category as keyof typeof categoryIcons] || <Crown className="h-5 w-5" />}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    
                  </div>
                  {plan.buttonState === 'current' && (
                    <Badge variant="default" className="bg-green-500">
                      Current
                    </Badge>
                  )}
                </div>
                
                {/* Price Section - Fixed Height for Alignment */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    {/* Calculate original price based on billing cycle discount */}
                    {(() => {
                      const discountPercentage = plan.billing_cycle === 3 ? 10 : plan.billing_cycle === 6 ? 20 : 30;
                      const originalPrice = Math.round(plan.price / (1 - discountPercentage / 100));
                      const hasDiscount = discountPercentage > 0;
                      
                      return (
                        <>
                          {hasDiscount && (
                            <span className="text-lg font-medium text-muted-foreground line-through">
                              ₹{originalPrice.toLocaleString()}
                            </span>
                          )}
                          <span className={`font-medium ${hasDiscount ? 'text-3xl text-green-600' : 'text-4xl'}`}>
                            ₹{plan.price.toLocaleString()}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Billed every {plan.billing_cycle} months
                  </p>
                </div>
              </div>
              
              {/* Features Section - Flexible Height */}
              <div className="flex-1 mb-6">
                {plan.features && Array.isArray(plan.features) && (
                  <ul className="space-y-2">
                    {plan.features.slice(0, 3).map((feature: any, index: number) => {
                      const featureText = typeof feature === 'string' 
                        ? feature 
                        : feature?.name || 'Feature included';
                      return (
                        <li key={index} className="flex items-center gap-2 text-sm font-medium text-foreground/60">
                          <BadgeCheck strokeWidth={1} size={16} />
                          {featureText}
                        </li>
                      );
                    })}
                    {plan.features.length > 3 && (
                      <li className="flex items-center gap-2 text-sm font-medium text-foreground/60">
                        <BadgeCheck strokeWidth={1} size={16} />
                        And {plan.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                )}
              </div>
              
              {/* Button Section - Always at Bottom */}
              <div className="mt-auto">
        {plan.action.type === 'subscribe' || plan.action.type === 'retry_payment' || plan.action.type === 'payment_verification' || plan.action.type === 'resume_subscription' ? (
          <SubscribeButton
            razorpayPlanId={plan.razorpay_plan_id}
            selectedCycle={plan.billing_cycle}
            buttonText={plan.buttonText}
            className={getButtonClassName(plan)}
            onSuccess={handleSubscriptionSuccess}
            retryMode={plan.action.type === 'retry_payment' || plan.action.type === 'payment_verification' || plan.action.type === 'resume_subscription'}
            existingSubscriptionId={(plan.action.type === 'retry_payment' || plan.action.type === 'payment_verification' || plan.action.type === 'resume_subscription') ? plan.action.subscriptionId : undefined}
          />
        ) : (
                  <Button
                    onClick={() => handlePlanAction(plan)}
                    disabled={plan.disabled || isUpdating || isCancelling || isUpdatingPlan}
                    className={getButtonClassName(plan)}
                    title={plan.disabled && plan.action.type === 'disabled' ? 'All-In-One plan already covers this category.' : undefined}
                  >
                    {(isUpdating && (plan.action.type === 'upgrade' || plan.action.type === 'downgrade')) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (isCancelling && plan.action.type === 'cancel_first') ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      plan.buttonText
                    )}
                  </Button>
                )}
              </div>
            </Card>
          ))}
      </div>

      {/* Confirmation Dialog for Plan Updates */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedPlan?.action.type === 'upgrade' ? 'Upgrade Subscription' : 'Downgrade Subscription'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPlan ? (() => {
                // Find current plan to determine if this is All-In-One downgrade
                const currentPlan = plans.find(p => p.action.type === 'current') || null;
                return getConfirmationMessage(currentPlan, selectedPlan);
              })() : 'Loading...'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingPlan}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPlanUpdate}
              disabled={isUpdatingPlan}
              className="bg-strentor-red hover:bg-strentor-red/90 text-white"
            >
              {isUpdatingPlan ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {selectedPlan?.action.type === 'upgrade' ? 'Upgrading...' : 'Downgrading...'}
                </>
              ) : (
                selectedPlan?.action.type === 'upgrade' ? 'Upgrade Now' : 'Downgrade Now'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 