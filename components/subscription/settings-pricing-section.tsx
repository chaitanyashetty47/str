'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Sparkles, Zap, Crown, Star, BadgeCheck } from 'lucide-react';
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
  { label: "Quarterly", value: 3 },
  { label: "Semi-Annual", value: 6 },
  { label: "Annual", value: 12 },
];

const categoryIcons = {
  FITNESS: <Zap className="h-5 w-5" />,
  PSYCHOLOGY: <Sparkles className="h-5 w-5" />,
  MANIFESTATION: <Star className="h-5 w-5" />,
  ALL_IN_ONE: <Crown className="h-5 w-5" />
};





export function SettingsPricingSection({ 
  userId, 
  onSubscriptionSuccess 
}: SettingsPricingSectionProps) {
  const [plans, setPlans] = useState<PlanMatrixItem[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
      case 'upgrade':
      case 'downgrade':
        if (action.subscriptionId && action.planId) {
          executeUpdate({
            userId,
            subscriptionId: action.subscriptionId,
            newPlanId: action.planId
          });
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

  const handleSubscriptionSuccess = () => {
    loadPlans(); // Refresh the plans
    onSubscriptionSuccess?.();
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
    if (plan.buttonState === 'current') {
      return "w-full bg-green-500 hover:bg-green-600 text-white";
    }
    return "w-full bg-strentor-red hover:bg-strentor-red/90 text-white";
  };

  // Filter plans based on selected billing cycle
  const filteredPlans = plans.filter(
    (plan) => plan.billing_cycle === selectedCycle
  );

  return (
    <div className="space-y-8">
      {/* Pricing Header with Billing Cycle Tabs */}
      <PricingHeader
        title="All Subscription Plans"
        subtitle="Choose from quarterly, semi-annual, or annual billing for each category"
        options={billingOptions}
        selected={selectedCycle}
        onSelect={setSelectedCycle}
      />

      {/* Single Grid Layout - No Category Grouping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    {categoryIcons[plan.category as keyof typeof categoryIcons]}
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
                    <span className="text-4xl font-medium">₹{plan.price.toLocaleString()}</span>
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
                {plan.action.type === 'subscribe' ? (
                  <SubscribeButton
                    razorpayPlanId={plan.razorpay_plan_id}
                    selectedCycle={plan.billing_cycle}
                    buttonText={plan.buttonText}
                    className={getButtonClassName(plan)}
                    onSuccess={handleSubscriptionSuccess}
                  />
                ) : (
                  <Button
                    onClick={() => handlePlanAction(plan)}
                    disabled={plan.disabled || isUpdating || isCancelling}
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
    </div>
  );
} 