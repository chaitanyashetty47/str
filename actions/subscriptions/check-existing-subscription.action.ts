import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";

export async function checkExistingSubscription(razorpayPlanId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Check for existing subscriptions with ongoing statuses
  const existingSubscription = await prisma.user_subscriptions.findFirst({
    where: {
      user_id: userId,
      subscription_plans: {
        razorpay_plan_id: razorpayPlanId
      },
      status: {
        in: ['CREATED', 'AUTHENTICATED', 'ACTIVE', 'PAUSED', 'HALTED']
      }
    }
  });

  return {
    hasExistingSubscription: !!existingSubscription,
    subscription: existingSubscription
  };
}
