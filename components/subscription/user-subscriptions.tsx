'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreVertical, Calendar, CreditCard, AlertCircle, Edit } from 'lucide-react';
import { SubscriptionWithPlan } from '@/actions/subscriptions/get-user-subscriptions';
import { updateSubscription } from '@/actions/subscriptions/update-subscription.action';
import { getAvailablePlanChanges } from '@/actions/subscriptions/get-available-plan-changes.action';
import { toast } from 'sonner';

interface UserSubscriptionsProps {
  subscriptions: SubscriptionWithPlan[];
  onRefresh: () => void;
  userId: string;
}

export function UserSubscriptions({ subscriptions, onRefresh, userId }: UserSubscriptionsProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Plan change states
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [selectedSubscriptionForChange, setSelectedSubscriptionForChange] = useState<SubscriptionWithPlan | null>(null);
  const [availablePlanChanges, setAvailablePlanChanges] = useState<any>(null);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  const handleCancelClick = (subscription: SubscriptionWithPlan) => {
    setSelectedSubscription(subscription);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedSubscription?.razorpaySubscriptionId) return;

    setIsCancelling(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpaySubscriptionId: selectedSubscription.razorpaySubscriptionId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel subscription');
      }

      // Success
      toast.success('Subscription cancellation scheduled successfully', {
        description: 'Your subscription will remain active until the end of the current billing cycle.',
      });
      setCancelDialogOpen(false);
      setSelectedSubscription(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
      toast.error('Cancellation Failed', {
        description: errorMessage,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleChangePlan = async (subscription: SubscriptionWithPlan) => {
    // Use internal modal logic 
    setSelectedSubscriptionForChange(subscription);
    
    try {
      // Fetch available plan changes
      const result = await getAvailablePlanChanges({ userId });
      if (result.data) {
        setAvailablePlanChanges(result.data);
        setChangePlanDialogOpen(true);
      } else {
        toast.error('Failed to load plan options');
      }
    } catch (error) {
      console.error('Failed to fetch plan changes:', error);
      toast.error('Failed to load plan options');
    }
  };

  const handleUpdatePlan = async (newPlanId: string) => {
    if (!selectedSubscriptionForChange) return;
    
    setIsUpdatingPlan(true);
    try {
      const result = await updateSubscription({
        userId,
        subscriptionId: selectedSubscriptionForChange.id,
        newPlanId,
      });
      
      if (result.data) {
        toast.success('Plan updated successfully', {
          description: 'Your subscription has been updated and will take effect immediately.',
        });
        setChangePlanDialogOpen(false);
        setSelectedSubscriptionForChange(null);
        onRefresh();
      } else {
        toast.error('Failed to update plan', {
          description: result.error || 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
      toast.error('Failed to update plan');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const getStatusBadge = (subscription: SubscriptionWithPlan) => {
    // Check if cancellation is requested but still active
    if (subscription.cancelRequestedAt && subscription.status === 'ACTIVE') {
      const endDate = subscription.currentEnd ? 
        new Date(subscription.currentEnd).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) : 'Soon';
      return <Badge variant="destructive">Active Until {endDate}</Badge>;
    }
    
    switch (subscription.status) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="secondary">{subscription.status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FITNESS':
        return '💪';
      case 'PSYCHOLOGY':
        return '🧠';
      case 'MANIFESTATION':
        return '✨';
      case 'ALL_IN_ONE':
        return '🎯';
      default:
        return '📋';
    }
  };

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          <CreditCard className="mx-auto h-12 w-12 mb-2" />
          <p>No active subscriptions found</p>
        </div>
        <Button 
          variant="outline" 
          className='bg-primary hover:bg-primary/90 text-primary-foreground'
          onClick={() => {
            const pricingSection = document.getElementById('pricing-section');
            if (pricingSection) {
              pricingSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }
          }}
        >
          Browse Plans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((subscription) => (
        <Card key={subscription.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getCategoryIcon(subscription.plan.category)}</span>
                <div>
                  <CardTitle className="text-lg">{subscription.plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    {subscription.plan.category.toLowerCase().replace('_', ' ')} Plan
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(subscription)}
                {subscription.status === 'ACTIVE' && !subscription.cancelRequestedAt && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* <DropdownMenuItem 
                        onClick={() => handleChangePlan(subscription)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Change Plan
                      </DropdownMenuItem> */}
                      <DropdownMenuItem 
                        onClick={() => handleCancelClick(subscription)}
                        className="text-destructive focus:text-destructive"
                      >
                        Cancel Subscription
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Current Cycle</p>
                  <p className="text-muted-foreground">
                    {formatDate(subscription.currentStart)} - {formatDate(subscription.currentEnd)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Next Charge</p>
                  <p className="text-muted-foreground">
                    {formatDate(subscription.nextChargeAt)}
                  </p>
                </div>
              </div>
              <div>
                <p className="font-medium">₹{subscription.plan.price}</p>
                <p className="text-muted-foreground">per {subscription.plan.billingPeriod}</p>
              </div>
            </div>
            
            {subscription.cancelRequestedAt && (
              <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">Cancellation Scheduled</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your subscription will remain active until {formatDate(subscription.currentEnd)}. 
                  You'll lose access to premium features after this date.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will remain active until the end of the current billing cycle (
              {selectedSubscription && formatDate(selectedSubscription.currentEnd)}). 
              After that, you won't be charged again and will lose access to premium features.
              <br /><br />
              Are you sure you want to cancel your subscription?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel at Cycle End'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan Change Modal */}
      <AlertDialog open={changePlanDialogOpen} onOpenChange={setChangePlanDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Change Your Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a new plan for your subscription. Changes will take effect immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {availablePlanChanges && selectedSubscriptionForChange && (
            <div className="space-y-4">
              {/* Current Plan */}
              <div>
                <h3 className="font-semibold mb-2">Current Plan</h3>
                <div className="p-4 border rounded-lg bg-muted">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{selectedSubscriptionForChange.plan.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedSubscriptionForChange.plan.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{selectedSubscriptionForChange.plan.price}</p>
                      <p className="text-sm text-muted-foreground">per {selectedSubscriptionForChange.plan.billingPeriod}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Plans */}
              {availablePlanChanges.availableChanges.map((change: any) => {
                if (change.subscriptionId !== selectedSubscriptionForChange.id) return null;
                
                const allOptions = [...change.upgrades, ...change.downgrades, ...change.allInOneOptions];
                
                return (
                  <div key={change.subscriptionId}>
                    <h3 className="font-semibold mb-2">Available Plans</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allOptions.map((plan: any) => (
                        <div 
                          key={plan.id}
                          className="p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => handleUpdatePlan(plan.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{plan.name}</h4>
                              <p className="text-sm text-muted-foreground">{plan.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">₹{plan.price}</p>
                              <p className="text-sm text-muted-foreground">{plan.billing_cycle} months</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {!change.canUpgradeToAllInOne && change.allInOneOptions.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> To upgrade to an All-in-One plan, you'll need to cancel your other active subscriptions first.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingPlan}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 