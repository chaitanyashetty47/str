'use server';

import { createSafeAction, ActionState } from '@/lib/create-safe-action';
import prisma from '@/utils/prisma/prismaClient';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

// Input schema - no input needed, uses session user
const GetActiveSubscriptionsSchema = z.object({});

// Output type for active subscriptions
export type ActiveSubscriptionWithPlan = {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  currentStart: string | null;
  currentEnd: string | null;
  nextChargeAt: string | null;
  paymentStatus: string;
  razorpaySubscriptionId: string | null;
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

type InputType = z.infer<typeof GetActiveSubscriptionsSchema>;
type ReturnType = ActiveSubscriptionWithPlan[];

const handler = async (_: InputType): Promise<ActionState<InputType, ReturnType>> => {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'User not authenticated' };
    }

    // Get only ACTIVE subscriptions ordered by oldest first
    const subscriptions = await prisma.user_subscriptions.findMany({
      where: {
        user_id: user.id,
        status: 'ACTIVE',
        cancel_at_cycle_end: { not: true }, // Exclude subscriptions scheduled for cancellation
      },
      include: {
        subscription_plans: true,
      },
      orderBy: {
        start_date: 'asc', // Oldest first as requested
      },
    });

    const data: ActiveSubscriptionWithPlan[] = subscriptions.map((sub) => ({
      id: sub.id,
      status: sub.status || 'ACTIVE',
      startDate: sub.start_date?.toISOString() || '',
      endDate: sub.end_date?.toISOString() || null,
      currentStart: sub.current_start?.toISOString() || null,
      currentEnd: sub.current_end?.toISOString() || null,
      nextChargeAt: sub.next_charge_at?.toISOString() || null,
      paymentStatus: sub.payment_status || 'PENDING',
      razorpaySubscriptionId: sub.razorpay_subscription_id,
      cancelRequestedAt: sub.cancel_requested_at?.toISOString() || null,
      cancelAtCycleEnd: sub.cancel_at_cycle_end || false,
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
    console.error('Error fetching active subscriptions:', error);
    return { error: 'Failed to fetch active subscriptions' };
  }
};

export const getActiveSubscriptions = createSafeAction(
  GetActiveSubscriptionsSchema,
  handler
); 