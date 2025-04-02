import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { subscriptionId } = body;
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
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
    
    // Verify that the subscription belongs to this user
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select('id, razorpay_subscription_id')
      .eq('user_id', user.id)
      .eq('razorpay_subscription_id', subscriptionId)
      .single();
    
    if (subscriptionError || !subscription) {
      console.error('Error fetching subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Subscription not found or does not belong to this user' },
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
    
    try {
      // Cancel the subscription in Razorpay
      // Note: This only stops future renewals, access continues until the end date
      await razorpay.subscriptions.cancel(subscriptionId, true);
      
      // Update the subscription status in our database
      // The webhook will also update this when it receives the cancellation event
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
        })
        .eq('id', subscription.id);
      
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription status' },
          { status: 500 }
        );
      }
      
      // Record the cancellation event manually (in addition to the webhook)
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
      
      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled. You will have access until the end of your current billing period.'
      });
    } catch (error) {
      console.error('Error cancelling Razorpay subscription:', error);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in subscription cancellation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 