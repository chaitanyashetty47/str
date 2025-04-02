import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
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
      // Continue anyway since we have the main subscription data
    }
    
    return NextResponse.json({
      subscriptions,
      events: events || []
    });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 