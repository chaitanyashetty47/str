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
    const { subscriptionId, error, failureReason, errorDetails } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Update the subscription payment status to FAILED
    const updatedSubscription = await prisma.user_subscriptions.update({
      where: {
        id: subscriptionId,
        user_id: user.id, // Ensure user owns this subscription
      },
      data: {
        payment_status: 'FAILED',
      },
    });

    // Log the payment failure event with comprehensive error details
    await prisma.subscription_events.create({
      data: {
       // id: crypto.randomUUID(),
        event_type: 'payment_failed',
        user_id: user.id,
        subscription_id: subscriptionId,
        metadata: {
          // Legacy fields for backward compatibility
          error: error || 'Unknown error',
          failure_reason: failureReason || 'Payment processing failed',
          failed_at: new Date().toISOString(),
          
          // Enhanced error details from Razorpay payment.failed event
          ...(errorDetails && {
            razorpay_error_code: errorDetails.code,
            razorpay_error_description: errorDetails.description,
            razorpay_error_source: errorDetails.source,
            razorpay_error_step: errorDetails.step,
            razorpay_error_reason: errorDetails.reason,
            razorpay_order_id: errorDetails.orderId,
            razorpay_payment_id: errorDetails.paymentId,
            razorpay_subscription_id: errorDetails.subscriptionId,
          }),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment marked as failed successfully',
      subscription: updatedSubscription,
    });

  } catch (error) {
    console.error('Error marking payment as failed:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('permission')) {
        return NextResponse.json(
          { error: 'Subscription not found or you do not have permission to update it' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to mark payment as failed. Please try again.' },
      { status: 500 }
    );
  }
}
