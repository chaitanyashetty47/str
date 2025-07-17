'use client';

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChangePlanState } from '@/hooks/use-change-plan';

interface ChangePlanModalProps {
  state: ChangePlanState;
  onClose: () => void;
  onUpdatePlan: (newPlanId: string) => void;
}

export function ChangePlanModal({ state, onClose, onUpdatePlan }: ChangePlanModalProps) {
  const { isOpen, selectedSubscription, availablePlanChanges, isUpdating } = state;

  if (!selectedSubscription || !availablePlanChanges) return null;

  const currentSubscriptionChanges = availablePlanChanges.availableChanges.find(
    (change: any) => change.subscriptionId === selectedSubscription.id
  );

  const formatPrice = (price: number) => `₹${price}`;

  const getBillingCycleText = (cycle: number) => {
    switch (cycle) {
      case 3: return 'Quarterly';
      case 6: return 'Semi-Annual';
      case 12: return 'Annual';
      default: return `${cycle} months`;
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Change Your Plan</AlertDialogTitle>
          <AlertDialogDescription>
            Choose a new plan for your subscription. Changes will take effect immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {currentSubscriptionChanges && (
          <div className="space-y-4">
            {/* Current Plan */}
            <div>
              <h3 className="font-semibold mb-2">Current Plan</h3>
              <Card className="border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{currentSubscriptionChanges.currentPlan.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatPrice(currentSubscriptionChanges.currentPlan.price)}</span>
                    <Badge variant="secondary">
                      {getBillingCycleText(currentSubscriptionChanges.currentPlan.billing_cycle)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Available Upgrades */}
            {currentSubscriptionChanges.upgrades && currentSubscriptionChanges.upgrades.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-green-600">Upgrades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentSubscriptionChanges.upgrades.map((plan: any) => (
                    <Card key={plan.id} className="border-green-200 bg-green-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{plan.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatPrice(plan.price)}</span>
                          <Badge variant="secondary">
                            {getBillingCycleText(plan.billing_cycle)}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full" 
                          onClick={() => onUpdatePlan(plan.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Updating...' : 'Upgrade'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Available Downgrades */}
            {currentSubscriptionChanges.downgrades && currentSubscriptionChanges.downgrades.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-orange-600">Downgrades</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentSubscriptionChanges.downgrades.map((plan: any) => (
                    <Card key={plan.id} className="border-orange-200 bg-orange-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{plan.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatPrice(plan.price)}</span>
                          <Badge variant="secondary">
                            {getBillingCycleText(plan.billing_cycle)}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => onUpdatePlan(plan.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Updating...' : 'Downgrade'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* ALL_IN_ONE Options */}
            {currentSubscriptionChanges.allInOneOptions && currentSubscriptionChanges.allInOneOptions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-purple-600">All-in-One Plans</h3>
                {!currentSubscriptionChanges.canUpgradeToAllInOne && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> To upgrade to an All-in-One plan, you'll need to cancel your other active subscriptions first.
                    </p>
                    {currentSubscriptionChanges.needsCancellationFirst && (
                      <div className="mt-2">
                        <p className="text-xs text-yellow-700">Plans that need cancellation:</p>
                        <ul className="text-xs text-yellow-700 list-disc list-inside">
                          {currentSubscriptionChanges.needsCancellationFirst.map((plan: any, index: number) => (
                            <li key={index}>{plan.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentSubscriptionChanges.allInOneOptions.map((plan: any) => (
                    <Card key={plan.id} className="border-purple-200 bg-purple-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{plan.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatPrice(plan.price)}</span>
                          <Badge variant="secondary">
                            {getBillingCycleText(plan.billing_cycle)}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full" 
                          onClick={() => onUpdatePlan(plan.id)}
                          disabled={isUpdating || !currentSubscriptionChanges.canUpgradeToAllInOne}
                        >
                          {isUpdating ? 'Updating...' : 'Upgrade to All-in-One'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No options available */}
            {(!currentSubscriptionChanges.upgrades || currentSubscriptionChanges.upgrades.length === 0) &&
             (!currentSubscriptionChanges.downgrades || currentSubscriptionChanges.downgrades.length === 0) &&
             (!currentSubscriptionChanges.allInOneOptions || currentSubscriptionChanges.allInOneOptions.length === 0) && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No plan changes available for this subscription.</p>
              </div>
            )}
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
} 