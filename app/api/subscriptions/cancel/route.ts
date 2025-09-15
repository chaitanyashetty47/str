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

    // STEP 1: Validate subscription exists and is cancellable (outside transaction)
    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        razorpay_subscription_id: razorpaySubscriptionId,
        user_id: user.id, // Ensure user owns this subscription
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found or you do not have permission to cancel it' },
        { status: 404 }
      );
    }

    // Check if subscription is in a cancellable state
    if (subscription.status && ['CANCELLED', 'EXPIRED', 'COMPLETED'].includes(subscription.status)) {
      return NextResponse.json(
        { error: 'Subscription is already in a final state and cannot be cancelled' },
        { status: 400 }
      );
    }

    // Check if cancellation is already requested
    if (subscription.cancel_requested_at) {
      return NextResponse.json(
        { error: 'Cancellation already requested for this subscription' },
        { status: 400 }
      );
    }

    // STEP 2: Call Razorpay API to cancel subscription at cycle end (outside transaction)
    console.log('Razorpay subscription ID:', razorpaySubscriptionId);
    const razorpayResponse = await razorpay.subscriptions.cancel(razorpaySubscriptionId, true); // Change to true for cycle end
    
    console.log('Razorpay cancel response:', razorpayResponse);

    // STEP 3: Update database (fast transaction with 120s timeout)
    const result = await prisma.$transaction(async (tx) => {
      // Update subscription with cancellation request
      await tx.user_subscriptions.update({
        where: {
          id: subscription.id,
        },
        data: {
          cancel_requested_at: new Date(),
          cancel_at_cycle_end: true,
          end_date: subscription.current_end,
          status: 'ACTIVE', // Keep as ACTIVE until webhook confirms actual cancellation
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
            razorpay_subscription_id: razorpaySubscriptionId,
            cancel_at_cycle_end: true,
            requested_at: new Date().toISOString(),
            //razorpay_response: razorpayResponse, // Store response for debugging
          },
        },
      });

      return {
        success: true,
        message: 'Subscription cancellation scheduled successfully',
      };
    }, {
      timeout: 120000, // 120 seconds timeout
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