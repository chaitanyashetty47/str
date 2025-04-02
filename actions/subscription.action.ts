"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

// Convert Unix timestamp to ISO date string
const unixToISOString = (timestamp: number | null): string | null => {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString();
};

export async function handleSubscriptionEvent(event: RazorpaySubscriptionEvent) {
  try {
    const supabase = await createClient();
    const eventType = event.event;
    const subscriptionData = event.payload.subscription.entity;
    const paymentData = event.payload.payment;
    
    // Get user_id from email (contact information in Razorpay payload)
    let userId: string | null = null;
    if (paymentData?.entity?.email) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("email", paymentData.entity.email)
        .single();
      
      if (userError) {
        console.error("Error fetching user:", userError);
        return { error: `User not found for email: ${paymentData.entity.email}` };
      }
      
      userId = userData.id;
    } else if (subscriptionData.notes && subscriptionData.notes.user_id) {
      // Fallback to check if user_id is in the notes
      userId = subscriptionData.notes.user_id;
    }
    
    if (!userId) {
      return { error: "Could not determine user ID from webhook data" };
    }
    
    // Lookup the subscription plan using the Razorpay plan_id
    const { data: planData, error: planError } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("razorpay_plan_id", subscriptionData.plan_id)
      .single();
    
    if (planError) {
      console.error("Error fetching plan:", planError);
      return { error: `Plan not found for Razorpay plan_id: ${subscriptionData.plan_id}` };
    }
    
    const planId = planData.id ;
    
    // Process based on event type
    switch (eventType) {
      case "subscription.authenticated":
        return handleSubscriptionAuthenticated(supabase, subscriptionData, planId, userId);
      
      case "subscription.activated":
        return handleSubscriptionActivated(supabase, subscriptionData, planId, userId);
      
      case "subscription.charged":
        return handleSubscriptionCharged(supabase, subscriptionData, planId, userId, paymentData);
      
      case "subscription.cancelled":
        return handleSubscriptionCancelled(supabase, subscriptionData, planId, userId);
      
      default:
        console.log(`Event type ${eventType} not handled`);
        return { data: null, error: null }; // Return success for events we don't handle
    }
  } catch (error) {
    console.error("Error in handleSubscriptionEvent:", error);
    return { error: "An unexpected error occurred processing the subscription event" };
  }
}

// Handle subscription.authenticated event
async function handleSubscriptionAuthenticated(
  supabase: any,
  subscriptionData: RazorpaySubscriptionEvent["payload"]["subscription"]["entity"],
  planId: string,
  userId: string
) {
  try {
    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("razorpay_subscription_id", subscriptionData.id)
      .single();
    
    if (existingSubscription) {
      // Update status if the subscription exists
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          payment_status: "pending",
          start_date: unixToISOString(subscriptionData.start_at),
          end_date: unixToISOString(subscriptionData.end_at)
        })
        .eq("id", existingSubscription.id);
      
      if (updateError) {
        console.error("Error updating subscription:", updateError);
        return { error: "Failed to update subscription status" };
      }
    } else {
      // Create a new subscription record
      const { error: insertError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          plan_id: planId,
          razorpay_subscription_id: subscriptionData.id,
          status: "active",
          payment_status: "pending",
          start_date: unixToISOString(subscriptionData.start_at),
          end_date: unixToISOString(subscriptionData.end_at)
        });
      
      if (insertError) {
        console.error("Error creating subscription:", insertError);
        return { error: "Failed to create subscription" };
      }
    }
    
    // Record the subscription event
    await recordSubscriptionEvent(
      supabase,
      "subscription.authenticated",
      subscriptionData.id,
      userId,
      planId,
      null,
      null,
      {
        chargeAt: unixToISOString(subscriptionData.charge_at),
        notes: subscriptionData.notes
      }
    );
    
    revalidatePath("/subscriptions");
    return { data: true, error: null };
  } catch (error) {
    console.error("Error in handleSubscriptionAuthenticated:", error);
    return { error: "Failed to process subscription authentication" };
  }
}

// Handle subscription.activated event
async function handleSubscriptionActivated(
  supabase: any,
  subscriptionData: RazorpaySubscriptionEvent["payload"]["subscription"]["entity"],
  planId: string,
  userId: string
) {
  try {
    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("razorpay_subscription_id", subscriptionData.id)
      .single();
    
    if (existingSubscription) {
      // Update the subscription
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({
          status: "active",
          start_date: unixToISOString(subscriptionData.current_start || subscriptionData.start_at),
          end_date: unixToISOString(subscriptionData.current_end || subscriptionData.end_at)
        })
        .eq("id", existingSubscription.id);
      
      if (updateError) {
        console.error("Error updating subscription:", updateError);
        return { error: "Failed to update subscription" };
      }
    } else {
      // Create a new subscription record
      const { error: insertError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          plan_id: planId,
          razorpay_subscription_id: subscriptionData.id,
          status: "active",
          payment_status: "pending",
          start_date: unixToISOString(subscriptionData.current_start || subscriptionData.start_at),
          end_date: unixToISOString(subscriptionData.current_end || subscriptionData.end_at)
        });
      
      if (insertError) {
        console.error("Error creating subscription:", insertError);
        return { error: "Failed to create subscription" };
      }
    }
    
    // Record the subscription event
    await recordSubscriptionEvent(
      supabase,
      "subscription.activated",
      subscriptionData.id,
      userId,
      planId,
      null,
      null,
      {
        current_start: unixToISOString(subscriptionData.current_start),
        current_end: unixToISOString(subscriptionData.current_end),
        notes: subscriptionData.notes
      }
    );
    
    revalidatePath("/subscriptions");
    return { data: true, error: null };
  } catch (error) {
    console.error("Error in handleSubscriptionActivated:", error);
    return { error: "Failed to process subscription activation" };
  }
}

// Handle subscription.charged event
async function handleSubscriptionCharged(
  supabase: any,
  subscriptionData: RazorpaySubscriptionEvent["payload"]["subscription"]["entity"],
  planId: string,
  userId: string,
  paymentData?: RazorpaySubscriptionEvent["payload"]["payment"]
) {
  try {
    // Check if subscription exists
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("razorpay_subscription_id", subscriptionData.id)
      .single();
    
    if (!subscription) {
      return { error: `Subscription not found: ${subscriptionData.id}` };
    }
    
    // Update subscription status
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        status: "active",
        payment_status: "completed",
        start_date: unixToISOString(subscriptionData.current_start),
        end_date: unixToISOString(subscriptionData.current_end)
      })
      .eq("id", subscription.id);
    
    if (updateError) {
      console.error("Error updating subscription:", updateError);
      return { error: "Failed to update subscription" };
    }
    
    // Record the subscription event with payment information
    await recordSubscriptionEvent(
      supabase,
      "subscription.charged",
      subscriptionData.id,
      userId,
      planId,
      paymentData?.entity?.id,
      paymentData?.entity?.amount,
      {
        payment_method: paymentData?.entity?.method,
        invoice_id: paymentData?.entity?.invoice_id,
        order_id: paymentData?.entity?.order_id,
        current_start: unixToISOString(subscriptionData.current_start),
        current_end: unixToISOString(subscriptionData.current_end)
      }
    );
    
    revalidatePath("/subscriptions");
    return { data: true, error: null };
  } catch (error) {
    console.error("Error in handleSubscriptionCharged:", error);
    return { error: "Failed to process subscription charge" };
  }
}

// Handle subscription.cancelled event
async function handleSubscriptionCancelled(
  supabase: any,
  subscriptionData: RazorpaySubscriptionEvent["payload"]["subscription"]["entity"],
  planId: string,
  userId: string
) {
  try {
    // Check if subscription exists
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("razorpay_subscription_id", subscriptionData.id)
      .single();
    
    if (!subscription) {
      return { error: `Subscription not found: ${subscriptionData.id}` };
    }
    
    // Update subscription status to cancelled
    // Note: We're not removing access immediately - access continues until the end date
    const { error: updateError } = await supabase
      .from("user_subscriptions")
      .update({
        status: "canceled",
      })
      .eq("id", subscription.id);
    
    if (updateError) {
      console.error("Error updating subscription:", updateError);
      return { error: "Failed to update subscription" };
    }
    
    // Record the subscription event
    await recordSubscriptionEvent(
      supabase,
      "subscription.cancelled",
      subscriptionData.id,
      userId,
      planId,
      null,
      null,
      {
        ended_at: unixToISOString(subscriptionData.ended_at),
        current_end: unixToISOString(subscriptionData.current_end)
      }
    );
    
    revalidatePath("/subscriptions");
    return { data: true, error: null };
  } catch (error) {
    console.error("Error in handleSubscriptionCancelled:", error);
    return { error: "Failed to process subscription cancellation" };
  }
}

// Helper function to record subscription events
async function recordSubscriptionEvent(
  supabase: any,
  eventType: string,
  subscriptionId: string,
  userId: string,
  subscriptionPlanId: string,
  paymentId: string | null = null,
  amount: number | null = null,
  metadata: Record<string, any> = {}
) {
  try {
    const { error } = await supabase
      .from("subscription_events")
      .insert({
        event_type: eventType,
        subscription_id: subscriptionId,
        user_id: userId,
        subscription_plan_id: subscriptionPlanId,
        payment_id: paymentId,
        amount: amount,
        metadata: metadata,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error recording subscription event:", error);
    }
  } catch (error) {
    console.error("Error in recordSubscriptionEvent:", error);
  }
} 