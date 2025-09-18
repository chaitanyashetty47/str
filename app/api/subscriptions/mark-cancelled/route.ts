import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma/prismaClient';
import Razorpay from 'razorpay';

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
    const { subscriptionId, reason } = await request.json();

    console.log('Mark cancelled - Subscription ID:', subscriptionId);
    console.log('Mark cancelled - Reason:', reason);

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Validate subscription exists and belongs to user
    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        razorpay_subscription_id: subscriptionId,
        user_id: user.id, // Ensure user owns this subscription
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Check if subscription is in a cancellable state
    if (subscription.status && ['CANCELLED', 'EXPIRED', 'COMPLETED'].includes(subscription.status)) {
      return NextResponse.json(
        { error: 'Subscription is already in a final state' },
        { status: 400 }
      );
    }

    // STEP 1: Cancel Razorpay subscription (if it exists)
    if (subscription.razorpay_subscription_id) {
      try {
        // Initialize Razorpay
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });
          
          // Cancel the Razorpay subscription immediately
          await razorpay.subscriptions.cancel(subscription.razorpay_subscription_id, false);
          console.log('Razorpay subscription cancelled successfully:', subscription.razorpay_subscription_id);
        } else {
          console.warn('Razorpay credentials not configured, skipping Razorpay cancellation');
        }
      } catch (razorpayError) {
        console.error('Failed to cancel Razorpay subscription:', razorpayError);
        // Continue with database operation even if Razorpay fails
        // This ensures we don't leave orphaned subscriptions in our database
      }
    }

    // STEP 2: Update subscription status to cancelled in database
    const result = await prisma.$transaction(async (tx) => {
      // Update subscription status
      const updatedSubscription = await tx.user_subscriptions.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: 'CANCELLED',
          payment_status: 'FAILED',
          // Clear any pending cancellation flags since we're cancelling immediately
          cancel_requested_at: null,
          cancel_at_cycle_end: null,
        },
      });

      // Log the cancellation event
      await tx.subscription_events.create({
        data: {
          //id: crypto.randomUUID(),
          event_type: 'subscription.cancelled',
          user_id: subscription.user_id,
          subscription_plan_id: subscription.plan_id,
          metadata: {
            cancellation_reason: reason || 'USER_CANCELLED',
            cancelled_at: new Date().toISOString(),
            cancellation_type: 'immediate',
            source: 'checkout_dismissed',
          }
        }
      });

      return updatedSubscription;
    });

    console.log(`Subscription marked as cancelled: ${subscriptionId} - Reason: ${reason}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: {
        id: result.id,
        status: result.status,
      }
    });

  } catch (error) {
    console.error('Mark cancelled error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}