import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma/prismaClient';
import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { razorpaySubscriptionId } = await request.json();

    if (!razorpaySubscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Use Prisma transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Find the subscription in our database
      const subscription = await tx.user_subscriptions.findFirst({
        where: {
          razorpay_subscription_id: razorpaySubscriptionId,
          user_id: user.id, // Ensure user owns this subscription
        },
      });

      if (!subscription) {
        throw new Error('Subscription not found or you do not have permission to cancel it');
      }

      // Step 2: Check if subscription is in a cancellable state
      if (subscription.status !== 'ACTIVE') {
        throw new Error('Only active subscriptions can be cancelled');
      }

      // Step 3: Check if cancellation is already requested
      if (subscription.cancel_requested_at) {
        throw new Error('Cancellation already requested for this subscription');
      }

      // Step 4: Call Razorpay API to cancel subscription at cycle end
      const razorpayResponse = await razorpay.subscriptions.cancel(razorpaySubscriptionId, true);

      console.log('Razorpay cancel response:', razorpayResponse);

      // Step 5: Update our database with cancellation request
      // According to Razorpay docs, subscription status becomes 'cancelled' immediately
      // but remains active until current_end date
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
          // Webhook will update status to CANCELLED when it actually ends
        },
      });

      // Step 6: Log the cancellation request event
      await tx.subscription_events.create({
        data: {
          id: crypto.randomUUID(),
          event_type: 'cancel_requested',
          user_id: subscription.user_id,
          subscription_plan_id: subscription.plan_id,
          metadata: {
            razorpay_subscription_id: razorpaySubscriptionId,
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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    
    // Handle specific Razorpay errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Cannot cancel expired subscription' },
          { status: 400 }
        );
      }
      if (error.message.includes('already cancelled')) {
        return NextResponse.json(
          { error: 'Subscription is already cancelled' },
          { status: 400 }
        );
      }
      if (error.message.includes('not found') || error.message.includes('permission')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('Only active subscriptions')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      if (error.message.includes('already requested')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to cancel subscription. Please try again.' },
      { status: 500 }
    );
  }
} 