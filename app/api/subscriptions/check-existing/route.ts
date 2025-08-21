import { NextRequest, NextResponse } from 'next/server';
import { checkExistingSubscription } from '@/actions/subscriptions/check-existing-subscription.action';

export async function POST(request: NextRequest) {
  try {
    const { razorpayPlanId } = await request.json();

    if (!razorpayPlanId) {
      return NextResponse.json(
        { error: 'Razorpay plan ID is required' },
        { status: 400 }
      );
    }

    const result = await checkExistingSubscription(razorpayPlanId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking existing subscription:', error);
    
    if (error instanceof Error && error.message === 'User not authenticated') {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
