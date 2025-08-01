'use server';

import { createSafeAction, ActionState } from '@/lib/create-safe-action';
import prisma from '@/utils/prisma/prismaClient';
import { z } from 'zod';

const GetPlanMatrixSchema = z.object({
  userId: z.string().uuid(),
});

type InputType = z.infer<typeof GetPlanMatrixSchema>;

export type PlanButtonState = 
  | 'current' 
  | 'scheduled_end' 
  | 'upgrade' 
  | 'downgrade' 
  | 'subscribe' 
  | 'conflict_all_in_one'
  | 'keep_one_active';

export type PlanMatrixItem = {
  id: string;
  name: string;
  category: string;
  billing_cycle: number;
  price: number;
  features: any;
  razorpay_plan_id: string;
  buttonState: PlanButtonState;
  buttonText: string;
  action: {
    type: 'current' | 'subscribe' | 'upgrade' | 'downgrade' | 'cancel_first' | 'disabled';
    subscriptionId?: string;
    planId?: string;
    endDate?: string;
    conflictSubscriptions?: string[];
  };
  disabled: boolean;
  variant: 'default' | 'outline' | 'destructive' | 'secondary';
};

type ReturnType = {
  plans: PlanMatrixItem[];
};

const handler = async (data: InputType): Promise<ActionState<InputType, ReturnType>> => {
  const { userId } = data;

  try {
    // Get all subscription plans
    const allPlans = await prisma.subscription_plans.findMany({
      orderBy: [
        { category: 'asc' },
        { billing_cycle: 'asc' }
      ]
    });

    // Get user's current subscriptions
    const userSubscriptions = await prisma.user_subscriptions.findMany({
      where: {
        user_id: userId,
        status: { in: ['ACTIVE', 'CREATED', 'AUTHENTICATED', 'PENDING'] }
      },
      include: {
        subscription_plans: true
      }
    });

 
    // Separate active vs scheduled for cancellation
    const activeSubscriptions = userSubscriptions.filter(sub => !sub.cancel_at_cycle_end);
    const scheduledCancellations = userSubscriptions.filter(sub => sub.cancel_at_cycle_end);

    // Check if user has multiple active plans - this affects upgrade/downgrade logic
    const hasMultipleActivePlans = activeSubscriptions.length > 1;

    // Build matrix with computed states
    const planMatrix: PlanMatrixItem[] = allPlans.map(plan => {
      // Check if user has active subscription in this category
      const activeInCategory = activeSubscriptions.find(sub => 
        sub.subscription_plans.category === plan.category
      );

      // Check if user has scheduled cancellation in this category
      const scheduledInCategory = scheduledCancellations.find(sub => 
        sub.subscription_plans.category === plan.category
      );

      // Check if this exact plan is current
      const isCurrentPlan = activeInCategory?.plan_id === plan.id;
      const isScheduledPlan = scheduledInCategory?.plan_id === plan.id;

      // Calculate button state and action
      let buttonState: PlanButtonState;
      let buttonText: string;
      let action: PlanMatrixItem['action'];
      let disabled = false;
      let variant: PlanMatrixItem['variant'] = 'default';

      if (isCurrentPlan) {
        buttonState = 'current';
        buttonText = 'Current Plan';
        action = { type: 'current' };
        disabled = true;
        variant = 'secondary';
      } else if (isScheduledPlan && scheduledInCategory) {
        buttonState = 'scheduled_end';
        const endDate = scheduledInCategory.current_end ? 
          new Date(scheduledInCategory.current_end).toLocaleDateString('en-GB') : 
          'Soon';
        buttonText = `Ends ${endDate}`;
        action = { 
          type: 'disabled', 
          endDate: scheduledInCategory.current_end?.toISOString() 
        };
        disabled = true;
        variant = 'destructive';
      } else if (activeInCategory) {
        // Same category, different plan - check if upgrade/downgrade is allowed
        const currentPlan = activeInCategory.subscription_plans;
        
        // For same-category plans, always allow upgrade/downgrade regardless of other active plans
        // Only block cross-category conflicts, not same-category changes
        if (plan.billing_cycle > currentPlan.billing_cycle) {
          // Allow upgrade within same category
          buttonState = 'upgrade';
          buttonText = `Upgrade to ${plan.billing_cycle === 3 ? 'Quarterly' : plan.billing_cycle === 6 ? 'Semi-Annual' : 'Annual'}`;
          action = { 
            type: 'upgrade', 
            subscriptionId: activeInCategory.id, 
            planId: plan.id 
          };
          variant = 'default';
        } else {
          // Allow downgrade within same category
          buttonState = 'downgrade';
          buttonText = `Downgrade to ${plan.billing_cycle === 3 ? 'Quarterly' : plan.billing_cycle === 6 ? 'Semi-Annual' : 'Annual'}`;
          action = { 
            type: 'downgrade', 
            subscriptionId: activeInCategory.id, 
            planId: plan.id 
          };
          variant = 'outline';
        }
      } else if (plan.category === 'ALL_IN_ONE' && activeSubscriptions.length > 1) {
        // ALL_IN_ONE with multiple active subscriptions - show actionable cancel option
        buttonState = 'conflict_all_in_one';
        buttonText = 'Cancel other plans first';
        action = { 
          //type: 'cancel_first',
          type: 'disabled',
          planId: plan.id,
          conflictSubscriptions: activeSubscriptions.map(sub => sub.id)
        };
        disabled = false; // Make it actionable
        variant = 'destructive';
      } else if (plan.category === 'ALL_IN_ONE' && activeSubscriptions.length === 1) {
        // User has exactly 1 active plan - allow upgrade to ALL_IN_ONE
        const activeSub = activeSubscriptions[0];
        buttonState = 'upgrade';
        buttonText = `Upgrade to All-in-One`;
        action = { 
          type: 'upgrade', 
          subscriptionId: activeSub.id, 
          planId: plan.id 
        };
        variant = 'default';
      } else if (activeSubscriptions.some(sub => sub.subscription_plans.category === 'ALL_IN_ONE')) {
        // User has ALL_IN_ONE, trying to subscribe to individual plan
        buttonState = 'conflict_all_in_one';
        buttonText = 'Keep one plan active';
        action = { 
          type: 'cancel_first', 
          planId: plan.id,
          conflictSubscriptions: activeSubscriptions.filter(sub => 
            sub.subscription_plans.category === 'ALL_IN_ONE'
          ).map(sub => sub.id)
        };
        disabled = true;
        variant = 'destructive';
      } else if (plan.category !== 'ALL_IN_ONE' && activeSubscriptions.length >= 2) {
        // User already has 2+ individual plans, trying to add another category
        // Suggest managing existing subscriptions first
        buttonState = 'keep_one_active';
        buttonText = 'Manage existing plans first';
        action = { 
          type: 'cancel_first', 
          planId: plan.id,
          conflictSubscriptions: activeSubscriptions.map(sub => sub.id)
        };
        disabled = true;
        variant = 'destructive';
      } else {
        // Available for subscription
        buttonState = 'subscribe';
        buttonText = 'Subscribe';
        action = { type: 'subscribe', planId: plan.id };
        variant = 'default';
      }

      return {
        id: plan.id,
        name: plan.name,
        category: plan.category,
        billing_cycle: plan.billing_cycle,
        price: Number(plan.price),
        features: plan.features,
        razorpay_plan_id: plan.razorpay_plan_id,
        buttonState,
        buttonText,
        action,
        disabled,
        variant
      };
    });

    return {
      data: {
        plans: planMatrix
      }
    };
  } catch (error) {
    console.error('Get plan matrix error:', error);
    return { error: 'Failed to get plan matrix' };
  }
};

export const getPlanMatrix = createSafeAction(
  GetPlanMatrixSchema,
  handler
); 