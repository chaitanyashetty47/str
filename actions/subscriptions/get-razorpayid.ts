import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";


export async function getRazorpayId() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }
  const profile = await prisma.subscription_plans.findMany({
    select: {
      id: true,
      name: true,
      plan_type: true,
      price: true,
      features: true,
      razorpay_plan_id: true,
      category: true,
      billing_cycle: true,
    },
  });
  return profile;
}