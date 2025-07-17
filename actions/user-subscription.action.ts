'use server';

import { PrismaClient } from "@prisma/client";
import { createClient } from '@/utils/supabase/server';
import Razorpay from 'razorpay';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface SubscriptionWithPlan {
  id: string;
  razorpaySubscriptionId: string;
  startDate: string;
  endDate: string | null;
  status: 'CREATED' | 'ACTIVE' | 'EXPIRED' | 'CANCELED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | null;
  plan: {
    id: string;
    name: string;
    price: number;
    category: string;
    planType: string | null;
    features: any;
    billingPeriod: string;
    billingCycle: number;
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

// Add this helper function or import it if it exists elsewhere

// Convert Unix timestamp to ISO date string
// const unixToISOString = (timestamp: number | null): string | null => {
//   if (!timestamp) return null;
//   return new Date(timestamp * 1000).toISOString();
// };

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
      .from('SubscriptionPlan')
      .select('*')
      .eq('razorpayPlanId', planId)
      .single();
    
    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return { error: 'Subscription plan not found', subscriptionId: '', key: '', amount: 0, currency: '', name: '', description: '' };
    }

    // Store the actual database plan ID
    const databasePlanId = plan.id;
    
    // Get user details
    const { data: userData, error: userDataError } = await supabase
      .from('User')
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
    if (!plan.razorpayPlanId) {
      return { error: 'Razorpay plan ID not configured for this plan', subscriptionId: '', key: '', amount: 0, currency: '', name: '', description: '' };
    }
    
    try {
      // Create Razorpay subscription first, outside the transaction
      let subscription;
      try {
        subscription = await razorpay.subscriptions.create({
          plan_id: plan.razorpayPlanId,
          customer_notify: 1,
          // total_count: plan.billingPeriod === 'yearly' ? 1 : 4,
          notes: {
            userId: user.id,
            plan_name: plan.name,
            planId: databasePlanId,
            category: plan.category
          }
        });

        console.log('Razorpay subscription created:\n', subscription);
      } catch (razorpayError) {
        console.error('Error creating Razorpay subscription:', razorpayError);
        throw new Error('Failed to create subscription with payment provider');
      }

      try {
        // Start a transaction with increased timeout
        const result = await prisma.$transaction(async (tx) => {
          // Check for existing active subscription
          const existingSubscription = await tx.userSubscription.findFirst({
            where: {
              userId: user.id,
              planId: databasePlanId,
              status: 'ACTIVE'
            }
          });

          if (existingSubscription) {
            throw new Error('You already have an active subscription of this type');
          }

          // Create initial subscription record
          await tx.userSubscription.create({
            data: {
              userId: user.id,
              planId: databasePlanId,
              razorpaySubscriptionId: subscription.id,
              status: 'CREATED',
              paymentStatus: 'PENDING'
            }
          });

          // Record the subscription creation event
          await tx.subscriptionEvent.create({
            data: {
              userId: user.id,
              eventType: 'subscription.created',
              subscriptionId: subscription.id,
              subscriptionPlanId: databasePlanId,
              metadata: {
                razorpaySubscription: subscription,
                createdAt: new Date().toISOString()
              }
            }
          });

          // Since we've already checked for RAZORPAY_KEY_ID existence above, we can safely assert it's a string
          const razorpayKeyId = process.env.RAZORPAY_KEY_ID as string;

          return {
            subscriptionId: subscription.id,
            key: razorpayKeyId,
            amount: plan.price * 100,
            currency: 'INR',
            name: plan.name,
            description: `${plan.category} Subscription - ${plan.name}`,
            prefill: {
              name: userData.name,
              email: userData.email,
            },
            notes: {
              userId: user.id,
              planId: databasePlanId,
            }
          };
        }, {
          timeout: 10000, // Increase timeout to 10 seconds
          maxWait: 15000, // Maximum time to wait for transaction to start
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Ensure data consistency
        });

        return result;
      } catch (transactionError) {
        // If transaction fails, cancel the Razorpay subscription
        try {
          console.error('Transaction failed, cleaning up Razorpay subscription:', subscription.id);
          await razorpay.subscriptions.cancel(subscription.id, true);
          console.log('Successfully cancelled Razorpay subscription after transaction failure');
        } catch (cancelError) {
          console.error('Failed to cancel Razorpay subscription after transaction failure:', cancelError);
          // Even though cleanup failed, we still want to throw the original error
        }
        throw transactionError; // Re-throw the original error after cleanup
      }
    } catch (error) {
      console.error('Error in subscription creation:', error);
      return { 
        error: error instanceof Error ? error.message : 'Internal server error', 
        subscriptionId: '', 
        key: '', 
        amount: 0, 
        currency: '', 
        name: '', 
        description: '' 
      };
    }
  } catch (error) {
    console.error('Error in subscription creation:', error);
    return { 
      error: error instanceof Error ? error.message : 'Internal server error', 
      subscriptionId: '', 
      key: '', 
      amount: 0, 
      currency: '', 
      name: '', 
      description: '' 
    };
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
      .from('UserSubscription')
      .select(`
        id,
        razorpaySubscriptionId,
        startDate,
        endDate,
        status,
        paymentStatus,
        plan:planId (
          id,
          name,
          price,
          category,
          planType,
          features,
          billingPeriod,
          billingCycle
        )
      `)
      .eq('userId', user.id)
      .order('startDate', { ascending: false });
    
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
      .from('SubscriptionEvent')
      .select('*')
      .eq('userId', user.id)
      .in('subscriptionId', subscriptions.map(sub => sub.razorpaySubscriptionId))
      .order('createdAt', { ascending: false });
    
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
      .from('UserSubscription')
      .select('id')
      .eq('userId', user.id)
      .eq('razorpaySubscriptionId', subscriptionId)
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
        .from('UserSubscription')
        .update({
          status: 'CANCELED',
        })
        .eq('id', subscription.id);
        
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return { success: false, error: 'Failed to update subscription status' };
      }
      
      // Record the cancellation event
      const { error: eventError } = await supabase
        .from('SubscriptionEvent')
        .insert({
          id: crypto.randomUUID(),
          eventType: 'subscription.cancelled.manual',
          subscriptionId: subscriptionId,
          userId: user.id,
          subscriptionPlanId: subscription.id,
          createdAt: new Date().toISOString(),
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
