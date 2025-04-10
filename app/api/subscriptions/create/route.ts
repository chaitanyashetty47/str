import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
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
    
    // Validate that the plan exists and is active
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name, price, razorpay_plan_id, category, billing_period, is_active')
      .eq('id', planId)
      .eq('is_active', true)
      .single();
    
    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found or inactive' },
        { status: 404 }
      );
    }
    
    // Check if user already has an active subscription of this type
    const { data: existingSubscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .eq('plan_id', planId)
      .single();
    
    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription of this type' },
        { status: 400 }
      );
    }
    
    // Get user details
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', user.id)
      .single();
    
    if (userDataError || !userData) {
      return NextResponse.json(
        { error: 'User details not found' },
        { status: 404 }
      );
    }
    
    // Initialize Razorpay
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
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
    try {
      // We need to use the Razorpay plan ID from our database
      if (!plan.razorpay_plan_id) {
        return NextResponse.json(
          { error: 'Payment configuration error' },
          { status: 400 }
        );
      }
      
      // Create the subscription in Razorpay with secure notes
      const subscription = await razorpay.subscriptions.create({
        plan_id: plan.razorpay_plan_id,
        customer_notify: 1,
        total_count: plan.billing_period === 'yearly' ? 1 : 4, // 1 year or 4 quarters
        notes: {
          user_id: user.id,
          plan_name: plan.name,
          plan_id: plan.id
        }
      });
      
      // Log the subscription creation for audit purposes
      await supabase.from('subscription_events').insert({
        event_type: 'subscription.created',
        user_id: user.id,
        plan_id: plan.id,
        metadata: { razorpay_subscription_id: subscription.id }
      });
      
      // Return only what's needed for the frontend, avoid sending sensitive data
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
        }
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 