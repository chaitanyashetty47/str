import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma/prismaClient';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Reset the subscription payment status to PENDING for retry
    const updatedSubscription = await prisma.user_subscriptions.update({
      where: {
        id: subscriptionId,
        user_id: user.id, // Ensure user owns this subscription
      },
      data: {
        payment_status: 'PENDING',
      },
    });

    // Log the retry attempt event
    await prisma.subscription_events.create({
      data: {
        id: crypto.randomUUID(),
        event_type: 'payment_retry_initiated',
        user_id: user.id,
        subscription_id: subscriptionId,
        metadata: {
          retry_initiated_at: new Date().toISOString(),
          previous_status: 'FAILED',
          new_status: 'PENDING'
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment status reset successfully for retry',
      subscription: updatedSubscription,
    });

  } catch (error) {
    console.error('Error resetting payment status:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('permission')) {
        return NextResponse.json(
          { error: 'Subscription not found or you do not have permission to update it' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to reset payment status. Please try again.' },
      { status: 500 }
    );
  }
}
