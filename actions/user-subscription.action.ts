'use server';

import { createClient } from '@/utils/supabase/server';
import Razorpay from 'razorpay';

export interface SubscriptionWithPlan {
  id: string;
  razorpay_subscription_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'canceled' | 'expired';
  payment_status: 'pending' | 'completed' | 'failed';
  subscription_plans: {
    id: string;
    name: string;
    price: number;
    category: string;
    plan_type: string;
    features: any;
    billing_period: string;
    billing_cycle: number;
  };
}

export interface SubscriptionResponse {
  subscriptions: {
    data: SubscriptionWithPlan[];
    error: string | null;
  };
  events?: any[];
}

export interface CreateSubscriptionResponse {
  subscriptionId: string;
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  notes?: Record<string, string>;
  error?: string;
}

export async function createUserSubscription(planId: string): Promise<CreateSubscriptionResponse> {
  try {
    const supabase = await createClient();
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { error: 'Unauthorized', subscriptionId: '', key: '', amount: 0, currency: '', name: '', description: '' };
    }
    
    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('razorpay_plan_id', planId)
      .single();
    
    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return { error: 'Subscription plan not found', subscriptionId: '', key: '', amount: 0, currency: '', name: '', description: '' };
    }
    
    // Get user details
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', user.id)
      .single();
    
    if (userDataError || !userData) {
      console.error('Error fetching user data:', userDataError);
      return { error: 'User details not found', subscriptionId: '', key: '', amount: 0, currency: '', name: '', description: '' };
    }
    
    // Initialize Razorpay
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      return { error: 'Payment provider not configured', subscriptionId: '', key: '', amount: 0, currency: '', name: '', description: '' };
    }
    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    // We need to use the Razorpay plan ID from our database
    if (!plan.razorpay_plan_id) {
      return { error: 'Razorpay plan ID not configured for this plan', subscriptionId: '', key: '', amount: 0, currency: '', name: '', description: '' };
    }
    
    try {
      // Create the subscription in Razorpay
      const subscription = await razorpay.subscriptions.create({
        plan_id: plan.razorpay_plan_id,
        customer_notify: 1,
        total_count: plan.billing_period === 'yearly' ? 1 : 4, // 1 year or 4 quarters
        notes: {
          user_id: user.id,
          plan_name: plan.name,
          plan_id: plan.id,
          category: plan.category
        }
      });
      
      // Return the subscription details for the frontend
      return {
        subscriptionId: subscription.id,
        key: process.env.RAZORPAY_KEY_ID,
        amount: plan.price * 100, // Convert to paise
        currency: 'INR',
        name: plan.name,
        description: `${plan.category} Subscription - ${plan.name}`,
        prefill: {
          name: userData.name,
          email: userData.email,
        },
        notes: {
          user_id: user.id,
          plan_id: planId,
        }
      };
    } catch (error) {
      console.error('Error creating Razorpay subscription:', error);
      return { error: 'Failed to create subscription', subscriptionId: '', key: '', amount: 0, currency: '', name: '', description: '' };
    }
  } catch (error) {
    console.error('Error in subscription creation:', error);
    return { error: 'Internal server error', subscriptionId: '', key: '', amount: 0, currency: '', name: '', description: '' };
  }
}

export async function getUserSubscriptions(): Promise<SubscriptionResponse> {
  try {
    const supabase = await createClient();
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        subscriptions: {
          data: [],
          error: 'Unauthorized'
        }
      };
    }
    
    // Fetch the user's subscriptions with plan details
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        razorpay_subscription_id,
        start_date,
        end_date,
        status,
        payment_status,
        subscription_plans:plan_id (
          id,
          name,
          price,
          category,
          plan_type,
          features,
          billing_period,
          billing_cycle
        )
      `)
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });
    
    if (subscriptionError) {
      console.error('Error fetching subscriptions:', subscriptionError);
      return {
        subscriptions: {
          data: [],
          error: 'Failed to fetch subscriptions'
        }
      };
    }
    
    // Get subscription events for additional context if needed
    const { data: events, error: eventsError } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('user_id', user.id)
      .in('subscription_id', subscriptions.map(sub => sub.razorpay_subscription_id))
      .order('created_at', { ascending: false });
    
    if (eventsError) {
      console.error('Error fetching subscription events:', eventsError);
    }
    
    return {
      subscriptions: {
        data: subscriptions as SubscriptionWithPlan[],
        error: null
      },
      events: events || []
    };
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return {
      subscriptions: {
        data: [],
        error: 'Internal server error'
      }
    };
  }
}

export async function cancelUserSubscription(subscriptionId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Verify the subscription belongs to the user
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('razorpay_subscription_id', subscriptionId)
      .single();
      
    if (subscriptionError || !subscription) {
      return { success: false, error: 'Subscription not found or not authorized' };
    }
    
    // Initialize Razorpay client
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      return { success: false, error: 'Payment provider not configured' };
    }
    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    try {
      // Cancel the subscription in Razorpay
      // Note: This only stops future renewals, access continues until the end date
      await razorpay.subscriptions.cancel(subscriptionId, true);
      
      // Update the subscription status in our database
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
        })
        .eq('id', subscription.id);
        
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return { success: false, error: 'Failed to update subscription status' };
      }
      
      // Record the cancellation event
      const { error: eventError } = await supabase
        .from('subscription_events')
        .insert({
          event_type: 'subscription.cancelled.manual',
          subscription_id: subscriptionId,
          user_id: user.id,
          subscription_plan_id: subscription.id,
          created_at: new Date().toISOString(),
          metadata: {
            canceled_by: 'user',
            cancel_at_cycle_end: true,
          }
        });
      
      if (eventError) {
        console.error('Error recording cancellation event:', eventError);
        // Continue anyway since the cancellation was successful
      }
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error cancelling Razorpay subscription:', error);
      return { success: false, error: 'Failed to cancel subscription with payment provider' };
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
