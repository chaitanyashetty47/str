'use server';

import { createSafeAction, ActionState } from '@/lib/create-safe-action';
import prisma from '@/utils/prisma/prismaClient';
import { z } from 'zod';

// Input schema - no input needed, uses session user
const GetUserSubscriptionsSchema = z.object({
  userId: z.string().uuid(),
});

// Output type
export type SubscriptionWithPlan = {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  currentStart: string | null;
  currentEnd: string | null;
  nextChargeAt: string | null;
  paymentStatus: string;
  razorpaySubscriptionId: string | null;
  totalCount: number | null;
  paidCount: number | null;
  remainingCount: number | null;
  retryAttempts: number | null;
  cancelRequestedAt: string | null;
  cancelAtCycleEnd: boolean | null;
  plan: {
    id: string;
    name: string;
    category: string;
    price: string;
    billingPeriod: string;
    features: any;
  };
};

type InputType = z.infer<typeof GetUserSubscriptionsSchema>;
type ReturnType = SubscriptionWithPlan[];

const handler = async (data: InputType): Promise<ActionState<InputType, ReturnType>> => {
  const { userId } = data;

  try {
    const now = new Date();
    
    const subscriptions = await prisma.user_subscriptions.findMany({
      where: {
        user_id: userId,
        // Include active subscriptions and cancelled-but-active subscriptions
        OR: [
          // Regular active subscriptions
          {
            status: 'ACTIVE',
            payment_status: 'COMPLETED',
            cancel_requested_at: null,
          },
          // Active subscriptions with pending payment (edge case)
          {
            status: 'ACTIVE',
            payment_status: 'PENDING',
            cancel_requested_at: null,
          },
          // Pending verification subscriptions
          {
            status: 'CREATED',
            payment_status: 'PENDING',
          },
          // Failed payment subscriptions
          {
            status: 'CREATED',
            payment_status: 'FAILED',
          },
          // Other active states (for backward compatibility)
          {
            status: { in: ['AUTHENTICATED', 'PENDING'] },
            cancel_requested_at: null,
          },
          // Cancelled subscriptions that are still within their cycle
          {
            status: 'ACTIVE', // Keep as ACTIVE until webhook confirms
            cancel_requested_at: { not: null },
            current_end: { gte: now }, // Still within current cycle
          },
        ],
      },
      include: {
        subscription_plans: true,
      },
      orderBy: {
        start_date: 'desc',
      },
    });

    console.log("The subscriptions are", subscriptions);

    // Additional filtering to ensure we don't show expired cancelled subscriptions
    const filteredSubscriptions = subscriptions.filter((sub) => {
      // Regular active subscriptions
      if (!sub.cancel_requested_at) {
        return true;
      }
      
      // Cancelled subscriptions - only show if still within cycle
      if (sub.cancel_requested_at && sub.current_end) {
        return new Date(sub.current_end) > now;
      }
      
      return false;
    });

    const data = filteredSubscriptions.map((sub) => ({
      id: sub.id,
      status: sub.status || 'ACTIVE',
      startDate: sub.start_date?.toISOString() || '',
      endDate: sub.end_date?.toISOString() || null,
      currentStart: sub.current_start?.toISOString() || null,
      currentEnd: sub.current_end?.toISOString() || null,
      nextChargeAt: sub.next_charge_at?.toISOString() || null,
      paymentStatus: sub.payment_status || 'PENDING',
      razorpaySubscriptionId: sub.razorpay_subscription_id,
      totalCount: sub.total_count,
      paidCount: sub.paid_count,
      remainingCount: sub.remaining_count,
      retryAttempts: sub.retry_attempts,
      cancelRequestedAt: sub.cancel_requested_at?.toISOString() || null,
      cancelAtCycleEnd: sub.cancel_at_cycle_end,
      plan: {
        id: sub.subscription_plans.id,
        name: sub.subscription_plans.name,
        category: sub.subscription_plans.category,
        price: sub.subscription_plans.price.toString(),
        billingPeriod: sub.subscription_plans.billing_period,
        features: sub.subscription_plans.features,
      },
    }));

    return { data };
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return { error: 'Failed to fetch subscriptions' };
  }
};

export const getUserSubscriptions = createSafeAction(
  GetUserSubscriptionsSchema,
  handler
);
