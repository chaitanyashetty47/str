'use server';

import { createSafeAction, ActionState } from '@/lib/create-safe-action';
import prisma from '@/utils/prisma/prismaClient';
import Razorpay from 'razorpay';
import { z } from 'zod';

const UpdateSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  subscriptionId: z.string().uuid(),
  newPlanId: z.string().uuid(),
});

type InputType = z.infer<typeof UpdateSubscriptionSchema>;
type ReturnType = { success: boolean; message: string };

const handler = async (data: InputType): Promise<ActionState<InputType, ReturnType>> => {
  const { userId, subscriptionId, newPlanId } = data;

  try {
    // 1. Get subscription and validate ownership
    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        id: subscriptionId,
        user_id: userId,
        status: 'ACTIVE',
      },
      include: {
        subscription_plans: true,
      },
    });

    if (!subscription) {
      return { error: 'Subscription not found or not active' };
    }

    // 2. Get new plan
    const newPlan = await prisma.subscription_plans.findUnique({
      where: { id: newPlanId },
    });

    if (!newPlan) {
      return { error: 'New plan not found' };
    }

    // 3. Calculate new total count based on billing cycle (30-year duration)
    const newTotalCount = newPlan.billing_cycle === 3 ? 120 : // Quarterly: 120 payments over 30 years
                         newPlan.billing_cycle === 6 ? 60 :   // Semi-Annual: 60 payments over 30 years
                         30;                                   // Annual: 30 payments over 30 years

    // Calculate remaining count: new total - what's already paid
    const newRemainingCount = newTotalCount - (subscription.paid_count || 0);

    if (newRemainingCount <= 0) {
      return { error: 'Invalid plan change: would result in negative remaining count' };
    }

    // 4. Initialize Razorpay and update subscription
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    await razorpay.subscriptions.update(subscription.razorpay_subscription_id!, {
      plan_id: newPlan.razorpay_plan_id,
      remaining_count: newRemainingCount,
    });

    // 5. Update our database (webhook will handle the rest)
    await prisma.user_subscriptions.update({
      where: { id: subscriptionId },
      data: {
        plan_id: newPlanId, // UUID from subscription_plans table
      },
    });

    return { 
      data: { 
        success: true, 
        message: 'Subscription updated successfully' 
      } 
    };
  } catch (error) {
    console.error('Update subscription error:', error);
    return { error: 'Failed to update subscription' };
  }
};

export const updateSubscription = createSafeAction(
  UpdateSubscriptionSchema,
  handler
); 