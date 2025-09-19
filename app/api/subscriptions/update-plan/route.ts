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

    // Calculate new total count for 30-year duration based on new billing cycle
    const newTotalCount = newPlan.billing_cycle === 3 ? 120 : 
                         newPlan.billing_cycle === 6 ? 60 : 30;

    // Log the update details
    console.log('🔄 Updating Razorpay subscription:', {
      razorpaySubscriptionId: currentSubscription.razorpay_subscription_id,
      currentPlan: currentSubscription.subscription_plans.name,
      currentPlanId: currentSubscription.subscription_plans.razorpay_plan_id,
      newPlan: newPlan.name,
      newPlanId: newPlan.razorpay_plan_id,
      category: newPlan.category,
      billingCycle: newPlan.billing_cycle,
      newTotalCount: newTotalCount
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
        remaining_count: newTotalCount,  // Reset to full 30-year duration
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

    // 🔍 COMPREHENSIVE LOGGING FOR TIMESTAMP CONVERSION
    const convertedStartDate = razorpayData.current_start ? new Date(razorpayData.current_start * 1000) : null;
    const convertedEndDate = razorpayData.current_end ? new Date(razorpayData.current_end * 1000) : null;
    
    console.log('✅ Razorpay update successful:', {
      subscriptionId: razorpayData.id,
      newPlanId: razorpayData.plan_id,
      status: razorpayData.status,
      rawCurrentStart: razorpayData.current_start,
      rawCurrentEnd: razorpayData.current_end,
      convertedStartDate: convertedStartDate?.toISOString(),
      convertedEndDate: convertedEndDate?.toISOString(),
      timestampConversion: {
        rawStart: razorpayData.current_start,
        rawEnd: razorpayData.current_end,
        startMultiplied: razorpayData.current_start * 1000,
        endMultiplied: razorpayData.current_end * 1000,
        startDate: convertedStartDate,
        endDate: convertedEndDate
      }
    });

    // Update database only after successful Razorpay update
    const updatedSubscription = await prisma.user_subscriptions.update({
      where: { id: subscriptionId },
      data: {
        plan_id: newPlanId,
        // Update other fields if needed based on Razorpay response
        // Razorpay timestamps are in seconds, so multiply by 1000 for JavaScript Date
        current_start: razorpayData.current_start ? new Date(razorpayData.current_start * 1000) : currentSubscription.current_start,
        current_end: razorpayData.current_end ? new Date(razorpayData.current_end * 1000) : currentSubscription.current_end,
        next_charge_at: razorpayData.next_charge_at ? new Date(razorpayData.next_charge_at * 1000) : currentSubscription.next_charge_at,
        total_count: razorpayData.total_count || newTotalCount,  // Use Razorpay response or our calculated value
        remaining_count: razorpayData.remaining_count || newTotalCount  // Reset to full duration
      },
      include: {
        subscription_plans: true
      }
    });

    console.log('🎉 Database update successful:', {
      subscriptionId: updatedSubscription.id,
      oldPlanId: currentSubscription.plan_id,
      newPlanId: updatedSubscription.plan_id,
      newPlanName: updatedSubscription.subscription_plans.name,
      savedCurrentStart: updatedSubscription.current_start?.toISOString(),
      savedCurrentEnd: updatedSubscription.current_end?.toISOString(),
      savedNextChargeAt: updatedSubscription.next_charge_at?.toISOString(),
      savedTotalCount: updatedSubscription.total_count,
      savedRemainingCount: updatedSubscription.remaining_count
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