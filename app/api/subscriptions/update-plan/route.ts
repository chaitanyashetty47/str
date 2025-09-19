import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma/prismaClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, newPlanId, userId } = body;

    if (!subscriptionId || !newPlanId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, newPlanId, userId' },
        { status: 400 }
      );
    }

    // Get the current subscription
    const currentSubscription = await prisma.user_subscriptions.findFirst({
      where: {
        id: subscriptionId,
        user_id: userId
      },
      include: {
        subscription_plans: true
      }
    });

    console.log('🔍 Current subscription lookup:', {
      subscriptionId,
      userId,
      found: !!currentSubscription,
      status: currentSubscription?.status,
      paymentStatus: currentSubscription?.payment_status,
      planName: currentSubscription?.subscription_plans?.name
    });

    if (!currentSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Get the new plan details
    const newPlan = await prisma.subscription_plans.findUnique({
      where: { id: newPlanId }
    });

    if (!newPlan) {
      return NextResponse.json(
        { error: 'New plan not found' },
        { status: 404 }
      );
    }

    // CRITICAL VALIDATION: Prevent updating CANCELLED subscriptions
    if (currentSubscription.status === 'CANCELLED') {
      console.log('❌ Attempted to update CANCELLED subscription:', {
        subscriptionId,
        status: currentSubscription.status,
        planName: currentSubscription.subscription_plans.name
      });
      return NextResponse.json(
        { error: 'Cannot update a cancelled subscription. Please subscribe to a new plan.' },
        { status: 400 }
      );
    }

    // Check if subscription is in a state that allows updates
    if (currentSubscription.status !== 'ACTIVE' || currentSubscription.payment_status !== 'COMPLETED') {
      console.log('❌ Subscription not in updatable state:', {
        subscriptionId,
        status: currentSubscription.status,
        paymentStatus: currentSubscription.payment_status,
        planName: currentSubscription.subscription_plans.name
      });
      return NextResponse.json(
        { error: 'Subscription must be active and payment completed to update plan' },
        { status: 400 }
      );
    }

    // Log the update details
    console.log('🔄 Updating Razorpay subscription:', {
      razorpaySubscriptionId: currentSubscription.razorpay_subscription_id,
      currentPlan: currentSubscription.subscription_plans.name,
      currentPlanId: currentSubscription.subscription_plans.razorpay_plan_id,
      newPlan: newPlan.name,
      newPlanId: newPlan.razorpay_plan_id,
      category: newPlan.category,
      billingCycle: newPlan.billing_cycle
    });

    // Update Razorpay subscription
    const razorpayResponse = await fetch(`https://api.razorpay.com/v1/subscriptions/${currentSubscription.razorpay_subscription_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan_id: newPlan.razorpay_plan_id,
        quantity: 1,
        schedule_change_at: "now",
        customer_notify: true
      })
    });

    if (!razorpayResponse.ok) {
      const razorpayError = await razorpayResponse.json();
      console.error('Razorpay update failed:', razorpayError);
      return NextResponse.json(
        { error: `Subscription update process to ${newPlan.name} failed: ${razorpayError.error?.description || 'Unknown error'}` },
        { status: 400 }
      );
    }

    const razorpayData = await razorpayResponse.json();

    console.log('✅ Razorpay update successful:', {
      subscriptionId: razorpayData.id,
      newPlanId: razorpayData.plan_id,
      status: razorpayData.status,
      currentStart: razorpayData.current_start,
      currentEnd: razorpayData.current_end
    });

    // Update database only after successful Razorpay update
    const updatedSubscription = await prisma.user_subscriptions.update({
      where: { id: subscriptionId },
      data: {
        plan_id: newPlanId,
        // Update other fields if needed based on Razorpay response
        current_start: razorpayData.current_start ? new Date(razorpayData.current_start) : currentSubscription.current_start,
        current_end: razorpayData.current_end ? new Date(razorpayData.current_end) : currentSubscription.current_end,
        next_charge_at: razorpayData.next_charge_at ? new Date(razorpayData.next_charge_at) : currentSubscription.next_charge_at,
        total_count: razorpayData.total_count || currentSubscription.total_count,
        remaining_count: razorpayData.remaining_count || currentSubscription.remaining_count
      },
      include: {
        subscription_plans: true
      }
    });

    console.log('🎉 Database update successful:', {
      subscriptionId: updatedSubscription.id,
      oldPlanId: currentSubscription.plan_id,
      newPlanId: updatedSubscription.plan_id,
      newPlanName: updatedSubscription.subscription_plans.name
    });

    return NextResponse.json({
      success: true,
      message: `Subscription successfully updated to ${newPlan.name}`,
      subscription: updatedSubscription
    });

  } catch (error) {
    console.error('Update plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}