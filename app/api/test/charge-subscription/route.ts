import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

/**
 * DEVELOPMENT ONLY - Test endpoint to manually trigger subscription charges
 * Remove this file before going to production
 */
export async function POST(request: NextRequest) {
  // Only allow in development/test environment
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
    }

    // Initialize Razorpay with test credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay credentials not configured' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log(`🧪 TEST: Manually charging subscription: ${subscriptionId}`);

    // Trigger immediate charge for the subscription
    const result = await razorpay.subscriptions.charge(subscriptionId);

    console.log('✅ Subscription charge triggered:', result);

    return NextResponse.json({
      success: true,
      message: 'Subscription charge triggered successfully',
      result
    });

  } catch (error) {
    console.error('❌ Failed to charge subscription:', error);
    
    return NextResponse.json({
      error: 'Failed to trigger subscription charge',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 