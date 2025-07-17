'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Sparkles, Zap, Crown, Star } from 'lucide-react';
import { SubscribeButton } from './subscribe-button';
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

const categoryIcons = {
  FITNESS: <Zap className="h-5 w-5" />,
  PSYCHOLOGY: <Sparkles className="h-5 w-5" />,
  MANIFESTATION: <Star className="h-5 w-5" />,
  ALL_IN_ONE: <Crown className="h-5 w-5" />
};

const categoryColors = {
  FITNESS: 'bg-blue-50 border-blue-200',
  PSYCHOLOGY: 'bg-purple-50 border-purple-200',
  MANIFESTATION: 'bg-yellow-50 border-yellow-200',
  ALL_IN_ONE: 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'
};

const categoryTitles = {
  FITNESS: 'Fitness',
  PSYCHOLOGY: 'Psychology',
  MANIFESTATION: 'Manifestation',
  ALL_IN_ONE: 'All-in-One'
};

const getBillingCycleLabel = (cycle: number) => {
  switch (cycle) {
    case 3: return 'Quarterly';
    case 6: return 'Semi-Annual';
    case 12: return 'Annual';
    default: return `${cycle} months`;
  }
};

export function SettingsPricingSection({ 
  userId, 
  onSubscriptionSuccess 
}: SettingsPricingSectionProps) {
  const [plans, setPlans] = useState<PlanMatrixItem[]>([]);
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading subscription plans...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
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
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Group plans by category for better organization
  const plansByCategory = plans.reduce((acc, plan) => {
    if (!acc[plan.category]) {
      acc[plan.category] = [];
    }
    acc[plan.category].push(plan);
    return acc;
  }, {} as Record<string, PlanMatrixItem[]>);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">All Subscription Plans</h3>
        <p className="text-sm text-muted-foreground">
          Choose from quarterly, semi-annual, or annual billing for each category
        </p>
      </div>

      {Object.entries(plansByCategory).map(([category, categoryPlans]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            {categoryIcons[category as keyof typeof categoryIcons]}
            <h4 className="text-md font-medium">
              {categoryTitles[category as keyof typeof categoryTitles]}
            </h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryPlans
              .sort((a, b) => a.billing_cycle - b.billing_cycle)
              .map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`${categoryColors[category as keyof typeof categoryColors]} ${
                    plan.buttonState === 'current' ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {plan.buttonState === 'current' && (
                        <Badge variant="default" className="bg-blue-500">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">₹{plan.price.toLocaleString()}</span>
                      <Badge variant="secondary">
                        {getBillingCycleLabel(plan.billing_cycle)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {plan.features && Array.isArray(plan.features) && (
                      <div className="space-y-1">
                        {plan.features.slice(0, 2).map((feature: any, index: number) => {
                          const featureText = typeof feature === 'string' 
                            ? feature 
                            : feature?.name || 'Feature included';
                          return (
                            <div key={index} className="text-sm text-muted-foreground">
                              • {featureText}
                            </div>
                          );
                        })}
                        {plan.features.length > 2 && (
                          <div className="text-sm text-muted-foreground">
                            • And {plan.features.length - 2} more features
                          </div>
                        )}
                      </div>
                    )}
                    
                    {plan.action.type === 'subscribe' ? (
                      <SubscribeButton
                        razorpayPlanId={plan.razorpay_plan_id}
                        selectedCycle={plan.billing_cycle}
                        buttonText={plan.buttonText}
                        className="w-full"
                        variant={plan.variant as any}
                        onSuccess={handleSubscriptionSuccess}
                      />
                    ) : (
                                          <Button
                      onClick={() => handlePlanAction(plan)}
                      disabled={plan.disabled || isUpdating || isCancelling}
                      className="w-full"
                      variant={plan.variant as any}
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
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
} 