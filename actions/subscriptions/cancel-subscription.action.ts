'use server';

import { createSafeAction, ActionState } from '@/lib/create-safe-action';
import prisma from '@/utils/prisma/prismaClient';
import Razorpay from 'razorpay';
import { z } from 'zod';
import crypto from 'crypto';

const CancelSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  subscriptionId: z.string().uuid(),
});

type InputType = z.infer<typeof CancelSubscriptionSchema>;
type ReturnType = { success: boolean; message: string };

const handler = async (data: InputType): Promise<ActionState<InputType, ReturnType>> => {
  const { userId, subscriptionId } = data;

  try {
    // Find the subscription in our database
    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        id: subscriptionId,
        user_id: userId,
      },
    });

    if (!subscription) {
      return { error: 'Subscription not found or you do not have permission to cancel it' };
    }

    // Check if subscription is in a cancellable state
    if (subscription.status !== 'ACTIVE') {
      return { error: 'Only active subscriptions can be cancelled' };
    }

    // Check if cancellation is already requested
    if (subscription.cancel_requested_at) {
      return { error: 'Cancellation already requested for this subscription' };
    }

    if (!subscription.razorpay_subscription_id) {
      return { error: 'Invalid subscription: missing Razorpay subscription ID' };
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Use Prisma transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Call Razorpay API to cancel subscription at cycle end
      const razorpayResponse = await razorpay.subscriptions.cancel(subscription.razorpay_subscription_id!, true);

      console.log('Razorpay cancel response:', razorpayResponse);

      // Update our database with cancellation request
      await tx.user_subscriptions.update({
        where: {
          id: subscription.id,
        },
        data: {
          cancel_requested_at: new Date(),
          cancel_at_cycle_end: true,
          // Set end_date to current cycle end - subscription will remain active until then
          end_date: subscription.current_end,
          // Keep status as ACTIVE until webhook confirms actual cancellation
        },
      });

      // Log the cancellation request event
      await tx.subscription_events.create({
        data: {
          id: crypto.randomUUID(),
          event_type: 'cancel_requested',
          user_id: subscription.user_id,
          subscription_plan_id: subscription.plan_id,
          metadata: {
            razorpay_subscription_id: subscription.razorpay_subscription_id,
            cancel_at_cycle_end: true,
            requested_at: new Date().toISOString(),
          },
        },
      });

      return {
        success: true,
        message: 'Subscription cancellation scheduled successfully',
      };
    });

    return { data: result };
  } catch (error) {
    console.error('Cancel subscription error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return { error: 'Cannot cancel expired subscription' };
      }
      if (error.message.includes('already cancelled')) {
        return { error: 'Subscription is already cancelled' };
      }
    }
    
    return { error: 'Failed to cancel subscription. Please try again.' };
  }
};

export const cancelSubscription = createSafeAction(
  CancelSubscriptionSchema,
  handler
); 