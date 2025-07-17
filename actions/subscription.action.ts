"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define types for Razorpay event payloads
type RazorpaySubscriptionEvent = {
  entity: "event";
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    subscription: {
      entity: {
        id: string;
        entity: string;
        plan_id: string;
        customer_id: string;
        status: string;
        current_start: number | null;
        current_end: number | null;
        ended_at: number | null;
        quantity: number;
        notes: Record<string, any>;
        charge_at: number;
        start_at: number;
        end_at: number;
        auth_attempts: number;
        total_count: number;
        paid_count: number;
        customer_notify: boolean;
        created_at: number;
        expire_by: number | null;
        short_url: string | null;
        has_scheduled_changes: boolean;
        change_scheduled_at: number | null;
        source: string;
        offer_id: string | null;
        remaining_count: number;
      };
    };
    payment?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id: string;
        international: boolean;
        method: string;
        amount_refunded: number;
        amount_transferred: number;
        refund_status: string | null;
        captured: string;
        description: string;
        card_id: string;
        bank: string | null;
        wallet: string | null;
        vpa: string | null;
        email: string;
        contact: string;
        customer_id: string;
        notes: Record<string, any>;
        fee: number;
        tax: number;
        error_code: string | null;
        error_description: string | null;
        created_at: number;
      };
    };
  };
  created_at: number;
};

// Helper function to convert Unix timestamp to ISO string
const unixToISOString = (timestamp: number | null): string | null => {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
};

export async function handleSubscriptionEvent(event: RazorpaySubscriptionEvent) {
  const eventType = event.event;
  const subscriptionData = event.payload.subscription.entity;
  const paymentData = event.payload.payment;

  try {
    // Get user_id and plan_id first
    const supabase = await createClient();
    let userId: string | null = null;
    
    if (paymentData?.entity?.email) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", paymentData.entity.email)
        .single();
      
      if (userError) {
        throw new Error(`User not found for email: ${paymentData.entity.email}`);
      }
      userId = userData.id;
    } else if (subscriptionData.notes && subscriptionData.notes.user_id) {
      userId = subscriptionData.notes.user_id;
    }

    if (!userId) {
      throw new Error("Could not determine user ID from webhook data");
    }

    const { data: planData, error: planError } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("razorpay_plan_id", subscriptionData.plan_id)
      .single();

    if (planError) {
      throw new Error(`Plan not found for Razorpay plan_id: ${subscriptionData.plan_id}`);
    }

    const planId = planData.id;

    // Handle the event within a transaction
    await prisma.$transaction(async (tx) => {
      switch (eventType) {
        case "subscription.authenticated":
          await handleSubscriptionAuthenticated(tx, subscriptionData, planId, userId!);
          break;
        case "subscription.activated":
          await handleSubscriptionActivated(tx, subscriptionData, planId, userId!);
          break;
        case "subscription.charged":
          await handleSubscriptionCharged(tx, subscriptionData, planId, userId!, paymentData);
          break;
        case "subscription.cancelled":
          await handleSubscriptionCancelled(tx, subscriptionData, planId, userId!);
          break;
        default:
          throw new Error(`Unhandled event type: ${eventType}`);
      }

      // Record the event
      await tx.subscription_events.create({
        data: {
          user_id: userId!,
          event_type: eventType,
          payment_id: paymentData?.entity?.id,
          amount: paymentData?.entity?.amount ? Number(paymentData.entity.amount) : null,
          subscription_id: subscriptionData.id,
          subscription_plan_id: planId,
          metadata: {
            razorpay_event: event,
            processed_at: new Date().toISOString()
          }
        }
      });
    });

    revalidatePath("/subscriptions");
    return { success: true, error: null };
  } catch (error) {
    console.error("Error in handleSubscriptionEvent:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Update handler functions to use transaction
async function handleSubscriptionAuthenticated(
  tx: any,
  subscriptionData: RazorpaySubscriptionEvent["payload"]["subscription"]["entity"],
  planId: string,
  userId: string
) {
  const existingSubscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (existingSubscription) {
    // Only update payment_status if it's not already completed
    const updateData: any = {
      status: "active",
      start_date: unixToISOString(subscriptionData.start_at),
      end_date: unixToISOString(subscriptionData.end_at)
    };
    
    if (existingSubscription.payment_status !== "completed") {
      updateData.payment_status = "pending";
    }

    await tx.user_subscriptions.update({
      where: { id: existingSubscription.id },
      data: updateData
    });
  } else {
    await tx.user_subscriptions.create({
      data: {
        user_id: userId,
        plan_id: planId,
        razorpay_subscription_id: subscriptionData.id,
        status: "active",
        payment_status: "pending",
        start_date: unixToISOString(subscriptionData.start_at),
        end_date: unixToISOString(subscriptionData.end_at)
      }
    });
  }
}

async function handleSubscriptionActivated(
  tx: any,
  subscriptionData: RazorpaySubscriptionEvent["payload"]["subscription"]["entity"],
  planId: string,
  userId: string
) {
  const existingSubscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  const updateData: any = {
    status: "active",
    start_date: unixToISOString(subscriptionData.current_start || subscriptionData.start_at),
    end_date: unixToISOString(subscriptionData.current_end || subscriptionData.end_at)
  };

  if (existingSubscription) {
    // Only update payment_status if it's not already completed
    if (existingSubscription.payment_status !== "completed") {
      updateData.payment_status = "pending";
    }

    await tx.user_subscriptions.update({
      where: { id: existingSubscription.id },
      data: updateData
    });
  } else {
    await tx.user_subscriptions.create({
      data: {
        ...updateData,
        user_id: userId,
        plan_id: planId,
        razorpay_subscription_id: subscriptionData.id,
        payment_status: "pending"
      }
    });
  }
}

async function handleSubscriptionCharged(
  tx: any,
  subscriptionData: RazorpaySubscriptionEvent["payload"]["subscription"]["entity"],
  planId: string,
  userId: string,
  paymentData?: RazorpaySubscriptionEvent["payload"]["payment"]
) {
  const subscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionData.id}`);
  }

  // For charged event, always update to completed as this is the source of truth for payment
  await tx.user_subscriptions.update({
    where: { id: subscription.id },
    data: {
      status: "active",
      payment_status: "completed",
      start_date: unixToISOString(subscriptionData.current_start),
      end_date: unixToISOString(subscriptionData.current_end)
    }
  });
}

async function handleSubscriptionCancelled(
  tx: any,
  subscriptionData: RazorpaySubscriptionEvent["payload"]["subscription"]["entity"],
  planId: string,
  userId: string
) {
  const subscription = await tx.user_subscriptions.findFirst({
    where: { razorpay_subscription_id: subscriptionData.id }
  });

  if (!subscription) {
    throw new Error(`Subscription not found: ${subscriptionData.id}`);
  }

  await tx.user_subscriptions.update({
    where: { id: subscription.id },
    data: {
      status: "canceled"
    }
  });
} 