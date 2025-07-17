"use server";

import prisma from "@/utils/prisma/prismaClient";
import { SubscriptionPlan } from "@/types/subscription";

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const plans = await prisma.subscription_plans.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        plan_type: true,
        price: true,
        features: true,
        razorpay_plan_id: true,
        billing_cycle: true,
      },
    });

    // Convert Prisma types to our interface
    return plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      category: plan.category,
      plan_type: plan.plan_type,
      price: Number(plan.price), // Convert Decimal to number
      features: Array.isArray(plan.features) 
        ? (plan.features as { name: string; included: boolean }[])
        : [],
      razorpay_plan_id: plan.razorpay_plan_id,
      billing_cycle: plan.billing_cycle as 3 | 6 | 12,
    }));
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    throw new Error("Failed to fetch subscription plans");
  }
} 