import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '@/utils/prisma/prismaClient';
import { getAuthenticatedUserId } from '@/utils/user';


export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { razorpayPlanId, selectedCycle } = body;
    
    if (!razorpayPlanId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const userId = user?.id;

    //const userId = await getAuthenticatedUserId();
    
    // Get the current authenticated user
    //const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("userId is:\n", userId);
    if (!userId || userError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Find the plan in database
    const plan = await prisma.subscription_plans.findFirst({
      where: { razorpay_plan_id: razorpayPlanId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: 'Subscription plan not found or inactive' },
        { status: 404 }
      );
    }
    
    // Check if user already has an active subscription of this category
    const existingSubscription = await prisma.user_subscriptions.findFirst({
      where: {
        user_id: userId,
        status: { in: ['CREATED', 'ACTIVE', 'AUTHENTICATED', 'PENDING'] },
        subscription_plans: {
          category: plan.category
        }
      },
      include: {
        subscription_plans: true
      }
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: `You already have an active ${plan.category.toLowerCase()} subscription` },
        { status: 400 }
      );
    }
    
    // Get user details from users_profile table
    const userData = await prisma.users_profile.findUnique({
      where: { id: userId },
      select: { email: true, name: true, phone: true }
    });
    
    if (!userData) {
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
    
    // Create a subscription with 30-year duration
    try {
      // Calculate total_count for 30 years based on billing cycle
      const totalCount = selectedCycle === 3 ? 120 : selectedCycle === 6 ? 60 : 30;
      
      const subscription = await razorpay.subscriptions.create({
        plan_id: plan.razorpay_plan_id,
        customer_notify: 1,
        total_count: totalCount, // 30 years
        notes: {
          user_id: userId,
          plan_name: plan.name,
          plan_id: plan.id,
          razorpay_plan_id: plan.razorpay_plan_id
        }
      });

      // Insert in user_subscriptions table
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 30); // 30 years from now

      await prisma.user_subscriptions.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          plan_id: plan.id,
          razorpay_subscription_id: subscription.id,
          status: 'CREATED',
          payment_status: 'PENDING',
          start_date: new Date(),
          end_date: endDate,
          total_count: totalCount,
          paid_count: 0,
          remaining_count: totalCount,
        }
      });
      
      // Return only what's needed for the frontend
      return NextResponse.json({
        subscriptionId: subscription.id,
        key: process.env.RAZORPAY_KEY_ID,
        amount: Number(plan.price) * 100, // Convert to paise
        currency: 'INR',
        name: plan.name,
        description: `${plan.category} Subscription - ${plan.name}`,
        prefill: {
          name: userData.name,
          email: userData.email,
          ...(userData.phone && { contact: userData.phone })
        },
        notes: {
          user_id: userId,
          plan_id: plan.id
        }
      });
    } catch (error) {
      console.error("Subscription creation error:", error);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 