import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma/prismaClient';

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

    // Update subscription status to cancelled (database only, no Razorpay API call)
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