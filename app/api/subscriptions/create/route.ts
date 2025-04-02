import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { planId } = body;
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('razorpay_plan_id', planId)
      .single();
    
    if (planError || !plan) {
      console.error('Error fetching plan:', planError);
      return NextResponse.json(
        { error: 'Subscription plan not found' },
        { status: 404 }
      );
    }
    
    // Get user details
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', user.id)
      .single();
    
    if (userDataError || !userData) {
      console.error('Error fetching user data:', userDataError);
      return NextResponse.json(
        { error: 'User details not found' },
        { status: 404 }
      );
    }
    
    // Initialize Razorpay
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 500 }
      );
    }
    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    // Create a subscription
    let subscription;
    
    try {
      // We need to use the Razorpay plan ID from our database
      if (!plan.razorpay_plan_id) {
        return NextResponse.json(
          { error: 'Razorpay plan ID not configured for this plan' },
          { status: 400 }
        );
      }
      
      // Create the subscription in Razorpay
      subscription = await razorpay.subscriptions.create({
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
      
      // Return the subscription ID for the frontend to use
      return NextResponse.json({
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
      });
    } catch (error) {
      console.error('Error creating Razorpay subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in subscription creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 