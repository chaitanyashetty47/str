import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma/prismaClient';
import { Prisma } from '@prisma/client';
import type { RazorpaySubscriptionWebhookPayload } from '@/types/razorpay';
import { safeUpdateSubscriptionStatus, type SubscriptionStatus, getSafeBillingCycleUpdate } from '@/utils/subscription-status';

// Improved webhook signature verification with timing-safe equals
const verifyRazorpaySignature = (
  body: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    console.error('Error comparing signatures:', error);
    return false;
  }
};

// Check if event is already processed (idempotency check)
const isEventProcessed = async (eventId: string): Promise<boolean> => {
  const existingEvent = await prisma.webhook_events.findUnique({
    where: { webhook_id: eventId }
  });
  
  return existingEvent !== null && existingEvent.status === 'success';
};

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Attempt to parse the JSON payload safely
    let payload: RazorpaySubscriptionWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as RazorpaySubscriptionWebhookPayload;
    } catch (parseError) {
      console.error('Webhook JSON parse error:', {
        message: (parseError as Error).message,
        bodySnippet: rawBody.slice(0, 200) // log first 200 chars for debugging
      });

      return NextResponse.json({
        error: 'Invalid JSON payload',
        errorType: 'INVALID_PAYLOAD'
      }, { status: 400 });
    }
    
  const webhookId = request.headers.get("x-razorpay-event-id");
    const signature = request.headers.get("x-razorpay-signature");
  
  if (!webhookId) {
      return NextResponse.json({ error: "Missing webhook ID" }, { status: 400 });
    }

    // Verify signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!verifyRazorpaySignature(rawBody, signature, secret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Check for duplicate processing
    const alreadyProcessed = await isEventProcessed(webhookId);
    if (alreadyProcessed) {
      console.log('Webhook already processed:', webhookId);
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    // Start transaction for webhook processing
    const result = await prisma.$transaction(async (tx) => {
      // Create webhook event record
      await tx.webhook_events.create({
            data: {
          //id: crypto.randomUUID(),
          webhook_id: webhookId,
          event_type: payload.event,
          payload: payload as unknown as Prisma.InputJsonValue,
              status: "processing",
          processed_at: new Date()
        }
      });

      // Process the webhook based on event type
      await processWebhookEvent(payload, tx);

      // Update webhook status to success
      await tx.webhook_events.update({
        where: { webhook_id: webhookId },
        data: {
          status: "success",
          error: null
        }
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing webhook:", error);
    
    // Try to update webhook status to failed
    try {
      const webhookId = request.headers.get("x-razorpay-event-id");
      if (webhookId) {
        await prisma.webhook_events.updateMany({
          where: { webhook_id: webhookId },
          data: {
            status: "failed",
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    } catch (updateError) {
      console.error("Failed to update webhook status:", updateError);
    }
    
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}

// Process different webhook events
async function processWebhookEvent(payload: RazorpaySubscriptionWebhookPayload, tx: any) {
  const eventType = payload.event;
  const subscriptionData = payload.payload?.subscription?.entity;
  
  if (!subscriptionData?.id) {
    throw new Error('Missing subscription data in webhook');
  }

  const subscriptionId = subscriptionData.id;
  
  console.log(`Processing webhook: ${eventType} for subscription: ${subscriptionId}`);

  switch (eventType) {
    case 'subscription.charged':
      await handleSubscriptionCharged(subscriptionData, payload.payload?.payment?.entity, tx);
      break;
      
    case 'subscription.activated':
      await handleSubscriptionActivated(subscriptionData, tx);
      break;
      
    case 'subscription.authenticated':
      await handleSubscriptionAuthenticated(subscriptionData, tx);
      break;
      
    case 'subscription.pending':
      await handleSubscriptionPending(subscriptionData, tx);
      break;
      
    case 'subscription.halted':
      await handleSubscriptionHalted(subscriptionData, tx);
      break;
      
    case 'subscription.cancelled':
      await handleSubscriptionCancelled(subscriptionData, tx);
      break;
      
    case 'subscription.completed':
      await handleSubscriptionCompleted(subscriptionData, tx);
      break;
      
    case 'subscription.paused':
      await handleSubscriptionPaused(subscriptionData, tx);
      break;
      
    case 'subscription.updated':
      await handleSubscriptionUpdated(subscriptionData, tx);
      break;
      
    default:
      console.log(`Unhandled webhook event: ${eventType}`);
  }
}

// Handle subscription.charged event
async function handleSubscriptionCharged(subscriptionData: any, paymentData: any, tx: any) {
  const subscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionData.id}`);
  }

  // Check if this is a recovery from PENDING/HALTED state
  const isRecovery = subscription.status === 'PENDING' || subscription.status === 'HALTED';

  // 🔍 COMPREHENSIVE LOGGING FOR DEBUGGING
  console.log('🔍 Subscription Charged - Raw Razorpay Data:', {
    subscriptionId: subscriptionData.id,
    charge_at: subscriptionData.charge_at,
    charge_at_type: typeof subscriptionData.charge_at,
    remaining_count: subscriptionData.remaining_count,
    remaining_count_type: typeof subscriptionData.remaining_count,
    paid_count: subscriptionData.paid_count,
    total_count: subscriptionData.total_count,
    current_start: subscriptionData.current_start,
    current_end: subscriptionData.current_end,
    status: subscriptionData.status
  });

  console.log('🔍 Current Database State:', {
    subscriptionId: subscription.id,
    currentStatus: subscription.status,
    currentPaymentStatus: subscription.payment_status,
    currentNextChargeAt: subscription.next_charge_at,
    currentRemainingCount: subscription.remaining_count,
    currentPaidCount: subscription.paid_count,
    currentTotalCount: subscription.total_count
  });


  // Prepare safe billing cycle update - Force UTC storage
  const newStart = subscriptionData.current_start 
    ? new Date(subscriptionData.current_start * 1000) 
    : null;
  const newEnd = subscriptionData.current_end 
    ? new Date(subscriptionData.current_end * 1000) 
    : null;
  
  const safeBillingUpdate = getSafeBillingCycleUpdate(
    subscription.current_start,
    subscription.current_end,
    newStart,
    newEnd
  );

  // 🔍 LOG NEXT_CHARGE_AT CALCULATION
  const hasRemainingCount = subscriptionData.remaining_count > 0;
  const hasChargeAt = !!subscriptionData.charge_at;
  const calculatedNextChargeAt = (hasRemainingCount && hasChargeAt) 
    ? new Date(subscriptionData.charge_at * 1000) 
    : null;

  console.log('🔍 Next Charge At Calculation:', {
    hasRemainingCount,
    remainingCount: subscriptionData.remaining_count,
    hasChargeAt,
    chargeAt: subscriptionData.charge_at,
    calculatedNextChargeAt: calculatedNextChargeAt?.toISOString(),
    calculationLogic: `(${hasRemainingCount} && ${hasChargeAt}) ? new Date(${subscriptionData.charge_at} * 1000) : null`
  });

  // Build update data
  const updateData = {
    payment_status: 'COMPLETED',
    
    // Set next_charge_at using charge_at field if available and remaining cycles > 0 (UTC)
    next_charge_at: calculatedNextChargeAt,
    
    // Update counters atomically
    paid_count: subscriptionData.paid_count,
    remaining_count: subscriptionData.remaining_count,
    total_count: subscriptionData.total_count,
    
    // Reset retry attempts on successful charge (especially important for recovery)
    retry_attempts: 0,
    
    // Only include billing cycle dates if they're safe to update
    ...(safeBillingUpdate || {})
  };

  console.log('🔍 Final Update Data:', {
    payment_status: updateData.payment_status,
    next_charge_at: updateData.next_charge_at?.toISOString(),
    paid_count: updateData.paid_count,
    remaining_count: updateData.remaining_count,
    total_count: updateData.total_count,
    retry_attempts: updateData.retry_attempts,
    billingCycleUpdate: safeBillingUpdate
  });

  // Update subscription with payment info using safe status update
  const updatedSubscription = await safeUpdateSubscriptionStatus(
    tx,
    subscription.id,
    'ACTIVE' as SubscriptionStatus,
    updateData
  );

  // 🔍 LOG DATABASE UPDATE RESULT
  console.log('🔍 Database Update Result:', {
    subscriptionId: subscription.id,
    updatedSubscription: updatedSubscription ? {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      payment_status: updatedSubscription.payment_status,
      next_charge_at: updatedSubscription.next_charge_at?.toISOString(),
      remaining_count: updatedSubscription.remaining_count,
      paid_count: updatedSubscription.paid_count,
      total_count: updatedSubscription.total_count
    } : 'No update performed (status unchanged)'
  });

  // Log the payment event
  await tx.subscription_events.create({
    data: {
      // id: crypto.randomUUID(),
      event_type: 'subscription.charged',
      user_id: subscription.user_id,
      subscription_plan_id: subscription.plan_id,
      payment_id: paymentData?.id,
      amount: paymentData?.amount ? paymentData.amount / 100 : null, // Convert from paise
      metadata: {
        razorpay_subscription_id: subscriptionData.id,
        razorpay_payment_id: paymentData?.id,
        charge_cycle: subscriptionData.paid_count,
        recovery: isRecovery
      }
    }
  });

  console.log(`Payment charged for subscription: ${subscriptionData.id}, amount: ${paymentData?.amount}${isRecovery ? ' (RECOVERY)' : ''}`);
}

// Handle subscription.activated event
async function handleSubscriptionActivated(subscriptionData: any, tx: any) {
  const subscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionData.id}`);
  }

  // Check if this is a recovery from PENDING/HALTED state
  const isRecovery = subscription.status === 'PENDING' || subscription.status === 'HALTED';

  // Prepare safe billing cycle update
  console.log('Current Date: \n', subscriptionData.current_start);
  console.log('Current End: \n', subscriptionData.current_end);


  const newStart = subscriptionData.current_start ? new Date(subscriptionData.current_start * 1000) : null;
  const newEnd = subscriptionData.current_end ? new Date(subscriptionData.current_end * 1000) : null;
  
  const safeBillingUpdate = getSafeBillingCycleUpdate(
    subscription.current_start,
    subscription.current_end,
    newStart,
    newEnd
  );

  // Build update data
  const updateData: any = {
    next_charge_at: (subscriptionData.remaining_count > 0 && subscriptionData.charge_at) 
      ? new Date(subscriptionData.charge_at * 1000) 
      : null,
    // Reset retry attempts on activation (especially for recovery)
    ...(isRecovery && { retry_attempts: 0 }),
    // Only include billing cycle dates if they're safe to update
    ...(safeBillingUpdate || {})
  };

  // Only set payment_status to PENDING if it's not already COMPLETED
  if (subscription.payment_status !== 'COMPLETED') {
    updateData.payment_status = 'PENDING';
  }

  await safeUpdateSubscriptionStatus(
    tx,
    subscription.id,
    'ACTIVE' as SubscriptionStatus,
    updateData
  );

  console.log(`Subscription activated: ${subscriptionData.id}${isRecovery ? ' (RECOVERY)' : ''}`);
}

// Handle subscription.authenticated event
async function handleSubscriptionAuthenticated(subscriptionData: any, tx: any) {
  const subscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionData.id}`);
  }

  // Only set payment_status to PENDING if it's not already COMPLETED
  const updateData: any = {};
  if (subscription.payment_status !== 'COMPLETED') {
    updateData.payment_status = 'PENDING';
  }

  await safeUpdateSubscriptionStatus(
    tx,
    subscription.id,
    'AUTHENTICATED' as SubscriptionStatus,
    updateData
  );

  console.log(`Subscription authenticated: ${subscriptionData.id}${subscription.payment_status === 'COMPLETED' ? ' (payment already completed)' : ''}`);
}

// Handle subscription.pending event
async function handleSubscriptionPending(subscriptionData: any, tx: any) {
  const subscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionData.id}`);
  }

  // Prepare safe billing cycle update - Force UTC storage
  const newStart = subscriptionData.current_start 
    ? new Date(subscriptionData.current_start * 1000) 
    : null;
  const newEnd = subscriptionData.current_end 
    ? new Date(subscriptionData.current_end * 1000) 
    : null;
  
  const safeBillingUpdate = getSafeBillingCycleUpdate(
    subscription.current_start,
    subscription.current_end,
    newStart,
    newEnd
  );

  // Build update data
  const updateData: any = {
    // Increment retry attempts
    retry_attempts: { increment: 1 },
    // Keep next_charge_at as provided by Razorpay (daily retry schedule)
    next_charge_at: subscriptionData.charge_at ? new Date(subscriptionData.charge_at * 1000) : null,
    // Update counters
    paid_count: subscriptionData.paid_count,
    remaining_count: subscriptionData.remaining_count,
    total_count: subscriptionData.total_count,
    // Only include billing cycle dates if they're safe to update
    ...(safeBillingUpdate || {})
  };

  // Only set payment_status to FAILED if it's not already COMPLETED
  if (subscription.payment_status !== 'COMPLETED') {
    updateData.payment_status = 'FAILED';
  }

  await safeUpdateSubscriptionStatus(
    tx,
    subscription.id,
    'PENDING' as SubscriptionStatus,
    updateData
  );

  console.log(`Subscription pending: ${subscriptionData.id}, retry attempt: ${subscription.retry_attempts + 1}`);
}

// Handle subscription.halted event
async function handleSubscriptionHalted(subscriptionData: any, tx: any) {
  const subscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionData.id}`);
  }

  // Prepare safe billing cycle update - Force UTC storage
  const newStart = subscriptionData.current_start 
    ? new Date(subscriptionData.current_start * 1000) 
    : null;
  const newEnd = subscriptionData.current_end 
    ? new Date(subscriptionData.current_end * 1000) 
    : null;
  
  const safeBillingUpdate = getSafeBillingCycleUpdate(
    subscription.current_start,
    subscription.current_end,
    newStart,
    newEnd
  );

  // Build update data
  const updateData: any = {
    // Keep retry_attempts as-is (should be 4 or more at this point)
    // Keep next_charge_at intact for when customer fixes payment method
    next_charge_at: subscriptionData.charge_at ? new Date(subscriptionData.charge_at * 1000) : null,
    // Update counters
    paid_count: subscriptionData.paid_count,
    remaining_count: subscriptionData.remaining_count,
    total_count: subscriptionData.total_count,
    // Only include billing cycle dates if they're safe to update
    ...(safeBillingUpdate || {})
  };

  // Only set payment_status to FAILED if it's not already COMPLETED
  if (subscription.payment_status !== 'COMPLETED') {
    updateData.payment_status = 'FAILED';
  }

  await safeUpdateSubscriptionStatus(
    tx,
    subscription.id,
    'HALTED' as SubscriptionStatus,
    updateData
  );

  console.log(`Subscription halted: ${subscriptionData.id}, retry attempts: ${subscription.retry_attempts}`);
}

// Handle subscription.cancelled event
async function handleSubscriptionCancelled(subscriptionData: any, tx: any) {
  const subscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionData.id}`);
  }

  // Check if this was a user-requested cancellation
  const wasUserCancelled = subscription.cancel_requested_at !== null;

  // Determine the correct end date
  let endDate: Date;
  
  if (subscriptionData.ended_at) {
    // If ended_at is provided, use it (immediate cancellation)
    endDate = new Date(subscriptionData.ended_at * 1000);
  } else if (subscriptionData.current_end) {
    // For "cancel at cycle end", use current cycle end date
    endDate = new Date(subscriptionData.current_end * 1000);
  } else {
    // Fallback to current date
    endDate = new Date();
  }

  await safeUpdateSubscriptionStatus(
    tx,
    subscription.id,
    'CANCELLED' as SubscriptionStatus,
    {
      end_date: endDate,
      // Clear cancellation request flags since cancellation is now complete
      cancel_requested_at: null,
      cancel_at_cycle_end: null,
    }
  );

  // Log the cancellation completion event
  await tx.subscription_events.create({
    data: {
      // id: crypto.randomUUID(),
      event_type: 'subscription.cancelled',
      user_id: subscription.user_id,
      subscription_plan_id: subscription.plan_id,
      metadata: {
        razorpay_subscription_id: subscriptionData.id,
        user_requested: wasUserCancelled,
        ended_at: endDate.toISOString(),
        cancellation_reason: wasUserCancelled ? 'user_requested' : 'system_cancelled',
        cancellation_type: subscriptionData.ended_at ? 'immediate' : 'cycle_end',
      }
    }
  });

  console.log(`Subscription cancelled: ${subscriptionData.id}${wasUserCancelled ? ' (USER REQUESTED)' : ' (SYSTEM)'} - End date: ${endDate.toISOString()}`);
}

// Handle subscription.completed event
async function handleSubscriptionCompleted(subscriptionData: any, tx: any) {
  const subscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionData.id}`);
  }

  await safeUpdateSubscriptionStatus(
    tx,
    subscription.id,
    'COMPLETED' as SubscriptionStatus
  );

  console.log(`Subscription completed: ${subscriptionData.id}`);
}

// Handle subscription.paused event
async function handleSubscriptionPaused(subscriptionData: any, tx: any) {
  const subscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionData.id}`);
  }

  await safeUpdateSubscriptionStatus(
    tx,
    subscription.id,
    'PAUSED' as SubscriptionStatus
  );

  console.log(`Subscription paused: ${subscriptionData.id}`);
}

// Handle subscription.updated event
async function handleSubscriptionUpdated(subscriptionData: any, tx: any) {
  const subscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionData.id}`);
  }

  // Reset the full subscription duration using start_at and end_at
  const newStartDate = subscriptionData.start_at 
    ? new Date(subscriptionData.start_at * 1000) 
    : null;
  const newEndDate = subscriptionData.end_at 
    ? new Date(subscriptionData.end_at * 1000) 
    : null;

  // Update billing cycle dates using current_start and current_end
  const newCurrentStart = subscriptionData.current_start 
    ? new Date(subscriptionData.current_start * 1000) 
    : null;
  const newCurrentEnd = subscriptionData.current_end 
    ? new Date(subscriptionData.current_end * 1000) 
    : null;

  await safeUpdateSubscriptionStatus(
    tx,
    subscription.id,
    'ACTIVE' as SubscriptionStatus,
    {
      // Update full subscription duration
      start_date: newStartDate,
      end_date: newEndDate,
      
      // Update current billing cycle
      current_start: newCurrentStart,
      current_end: newCurrentEnd,
      
      // Update counters from Razorpay
      total_count: subscriptionData.total_count,
      paid_count: subscriptionData.paid_count,
      remaining_count: subscriptionData.remaining_count,
      
      // Update next charge date
      next_charge_at: subscriptionData.charge_at 
        ? new Date(subscriptionData.charge_at * 1000) 
        : null,
    }
  );

  // Log the update event
  await tx.subscription_events.create({
    data: {
      // id: crypto.randomUUID(),
      event_type: 'subscription.updated',
      user_id: subscription.user_id,
      subscription_plan_id: subscription.plan_id,
      metadata: {
        razorpay_subscription_id: subscriptionData.id,
        updated_at: new Date().toISOString(),
        duration_reset: true,
        new_start_date: newStartDate?.toISOString(),
        new_end_date: newEndDate?.toISOString(),
      }
    }
  });

  console.log(`Subscription updated: ${subscriptionData.id} - Duration reset to 30 years from upgrade`);
}
