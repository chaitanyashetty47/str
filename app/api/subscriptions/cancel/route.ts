import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma/prismaClient';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    // Check Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 500 }
      );
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

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
    const { razorpaySubscriptionId, reason} = await request.json();

    console.log('Razorpay subscription ID:', razorpaySubscriptionId);
    console.log('Reason:', reason);

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
      // Allow cancellation of any non-final subscription status
      if (subscription.status && ['CANCELLED', 'EXPIRED', 'COMPLETED'].includes(subscription.status)) {
        throw new Error('Subscription is already in a final state and cannot be cancelled');
      }

      // Step 3: Check if cancellation is already requested
      if (subscription.cancel_requested_at) {
        throw new Error('Cancellation already requested for this subscription');
      }

      // Step 4: Call Razorpay API to cancel subscription at cycle end
      console.log('Razorpay subscription ID:', razorpaySubscriptionId);
      const razorpayResponse = await razorpay.subscriptions.cancel(razorpaySubscriptionId, false);

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
          cancel_at_cycle_end: false,
          // Set end_date to Today - subscription will remain active until then
          end_date: new Date(),
          //end_date: subscription.current_end,
          // Keep status as ACTIVE until webhook confirms actual cancellation
          status: 'CANCELLED',
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
  } catch (error:any) {
    console.error('Error cancelling subscription:', error);
    
    // Handle Razorpay API errors
    // Razorpay SDK typically puts the API response in error.response.data or error.data
    const razorpayError = error.response?.data || error.data;
    
    if (razorpayError?.error?.description) {
      const description = razorpayError.error.description;
      const code = razorpayError.error.code;
      
      console.log('Razorpay error:', { code, description });
      
      // Handle specific Razorpay error cases
      if (description.includes('expired') || description.includes('not cancellable in expired status')) {
        return NextResponse.json(
          { error: 'Cannot cancel expired subscription' },
          { status: 400 }
        );
      }
      
      if (description.includes('already cancelled') || description.includes('already canceled')) {
        return NextResponse.json(
          { error: 'Subscription is already cancelled' },
          { status: 400 }
        );
      }
      
      if (description.includes('not found') || description.includes('permission')) {
        return NextResponse.json(
          { error: 'Subscription not found or access denied' },
          { status: 404 }
        );
      }
      
      if (description.includes('Only active subscriptions') || description.includes('active state')) {
        return NextResponse.json(
          { error: 'Only active subscriptions can be cancelled' },
          { status: 400 }
        );
      }
      
      // Return the actual Razorpay error description for other cases
      return NextResponse.json(
        { error: description },
        { status: 400 }
      );
    }
    
    // Handle JavaScript errors (network issues, etc.)
    if (error instanceof Error) {
      console.error('JavaScript error:', error.message);
      
      // Check if it's a network or connection error
      if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Payment service temporarily unavailable. Please try again.' },
          { status: 503 }
        );
      }
      
      // Check for authentication errors
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Payment service authentication failed' },
          { status: 500 }
        );
      }
    }

    // Generic fallback for unknown errors
    return NextResponse.json(
      { error: 'Failed to cancel subscription. Please try again.' },
      { status: 500 }
    );
  }
} 