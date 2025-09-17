import { NextRequest, NextResponse } from "next/server";
import prisma from '@/utils/prisma/prismaClient';
import crypto from 'crypto';
import { safeUpdateSubscriptionStatus, type SubscriptionStatus } from '@/utils/subscription-status';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = body;

    console.log('Payment verification request:', {
      razorpay_subscription_id,
      razorpay_payment_id,
      signature_provided: !!razorpay_signature
    });

    if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
      const missingFields = [];
      if (!razorpay_subscription_id) missingFields.push('razorpay_subscription_id');
      if (!razorpay_payment_id) missingFields.push('razorpay_payment_id');
      if (!razorpay_signature) missingFields.push('razorpay_signature');
      
      console.error('Missing required parameters:', missingFields);
      return NextResponse.json({ 
        error: 'Missing required parameters',
        errorType: 'MISSING_PARAMETERS',
        missingFields 
      }, { status: 400 });
    }

    // Fetch the user's subscription to get the order details
    const subscription = await prisma.user_subscriptions.findFirst({
      where: { razorpay_subscription_id: razorpay_subscription_id }
    });

    if (!subscription) {
      console.error('Subscription not found:', razorpay_subscription_id);
      return NextResponse.json({ 
        error: 'Subscription not found',
        errorType: 'SUBSCRIPTION_NOT_FOUND',
        razorpay_subscription_id 
      }, { status: 404 });
    }

    console.log('Found subscription:', {
      id: subscription.id,
      user_id: subscription.user_id,
      current_status: subscription.status,
      payment_status: subscription.payment_status
    });

    // Get Razorpay secret key from environment
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('Razorpay secret key not configured');
      return NextResponse.json({ 
        error: 'Payment provider not configured',
        errorType: 'CONFIGURATION_ERROR'
      }, { status: 500 });
    }

    // Razorpay documentation for Subscriptions specifies the signature should be
    // generated using:  sha256( payment_id + '|' + subscription_id )
    // (Note the order is payment_id first). We compute both orders for debug.

    const payloadOfficial = `${razorpay_payment_id}|${razorpay_subscription_id}`;
    const payloadAlternate = `${razorpay_subscription_id}|${razorpay_payment_id}`; // previous order

    const signatureOfficial = crypto
      .createHmac('sha256', secret)
      .update(payloadOfficial)
      .digest('hex');

    const signatureAlternate = crypto
      .createHmac('sha256', secret)
      .update(payloadAlternate)
      .digest('hex');

    console.log('Signature verification:', {
      payloadOfficial,
      payloadAlternate,
      signatureOfficial,
      signatureAlternate,
      received_signature: razorpay_signature,
      matchesOfficial: signatureOfficial === razorpay_signature,
      matchesAlternate: signatureAlternate === razorpay_signature
    });

    const isSignatureValid = signatureOfficial === razorpay_signature;

    // Verify signature
    if (isSignatureValid) {
      // Calculate next billing date based on subscription plan
      const plan = await prisma.subscription_plans.findUnique({
        where: { id: subscription.plan_id }
      });

      // Default to current date if plan not found
      let currentEnd = new Date();

      if (plan) {
        // billing_cycle is stored as an integer (number of months)
        const billingMonths = Number(plan.billing_cycle);
        if (!Number.isNaN(billingMonths) && billingMonths > 0) {
          currentEnd.setMonth(currentEnd.getMonth() + billingMonths);
        }
      }

      // Signature verified, safely update subscription status with race condition handling
      let updatedSubscription;
      try {
        updatedSubscription = await prisma.$transaction(async (tx) => {
          return await safeUpdateSubscriptionStatus(
            tx,
            subscription.id,
            'ACTIVE' as SubscriptionStatus,
            {
              payment_status: 'COMPLETED',
              current_start: new Date(),
              current_end: currentEnd,
              paid_count: { increment: 1 },
              remaining_count: { decrement: 1 }
            }
          );
        });
      } catch (error) {
        // Handle race condition where webhook might have already updated the subscription
        console.warn('Race condition detected in verify-payment:', {
          subscription_id: subscription.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Fetch the current subscription state to return accurate info
        updatedSubscription = await prisma.user_subscriptions.findUnique({
          where: { id: subscription.id }
        });
        
        if (!updatedSubscription) {
          throw new Error('Subscription not found after race condition');
        }
      }

      console.log('Subscription activated successfully:', {
        subscription_id: updatedSubscription.id,
        user_id: updatedSubscription.user_id,
        status: updatedSubscription.status,
        payment_status: updatedSubscription.payment_status,
        current_start: updatedSubscription.current_start,
        current_end: updatedSubscription.current_end
      });

      // Log the successful payment event
      await prisma.subscription_events.create({
        data: {
          //id: crypto.randomUUID(),
          event_type: 'payment.verified',
          user_id: subscription.user_id,
          subscription_plan_id: subscription.plan_id,
          metadata: {
            razorpay_subscription_id,
            razorpay_payment_id,
            verification_method: 'frontend_callback'
          }
        }
      });

      return NextResponse.json({ 
        status: 'ok', 
        message: 'Payment verified successfully',
        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          payment_status: updatedSubscription.payment_status
        }
      }, { status: 200 });
    } else {
      console.error('Signature verification failed:', {
        expected: signatureOfficial,
        received: razorpay_signature,
        payload: payloadOfficial
      });

      return NextResponse.json({ 
        error: 'Payment signature verification failed',
        errorType: 'SIGNATURE_VERIFICATION_FAILED',
        message: 'The payment signature could not be verified. This may indicate a tampered payment or configuration issue.'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment verification error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      error: 'Internal server error during payment verification',
      errorType: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred while verifying the payment. Please try again or contact support.'
    }, { status: 500 });
  }
}
