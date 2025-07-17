'use server';

import { createSafeAction, ActionState } from '@/lib/create-safe-action';
import prisma from '@/utils/prisma/prismaClient';
import { z } from 'zod';

const GetAvailablePlanChangesSchema = z.object({
  userId: z.string().uuid(),
});

type InputType = z.infer<typeof GetAvailablePlanChangesSchema>;
type ReturnType = {
  currentSubscriptions: any[];
  availableChanges: {
    subscriptionId: string;
    currentPlan: any;
    upgrades: any[];
    downgrades: any[];
    allInOneOptions: any[];
    canUpgradeToAllInOne: boolean;
    needsCancellationFirst: any[];
  }[];
};

const handler = async (data: InputType): Promise<ActionState<InputType, ReturnType>> => {
  const { userId } = data;

  try {
    // Get user's current subscriptions
    const currentSubscriptions = await prisma.user_subscriptions.findMany({
      where: {
        user_id: userId,
        status: 'ACTIVE',
      },
      include: {
        subscription_plans: true,
      },
    });

    // Get all available plans
    const rawPlans = await prisma.subscription_plans.findMany();

    // Convert Decimal price to number for safe serialization
    const allPlans = rawPlans.map(p => ({
      ...p,
      price: Number(p.price),
    }));

    const availableChanges = currentSubscriptions.map(subscription => {
      const currentPlanRaw = subscription.subscription_plans;

      const currentPlan = {
        ...currentPlanRaw,
        price: Number(currentPlanRaw.price),
      };
      
      // Same category upgrades/downgrades
      const sameCategoryPlans = allPlans.filter(p => 
        p.category === currentPlan.category && p.id !== currentPlan.id
      );
      
      // ALL_IN_ONE options
      const allInOnePlans = allPlans.filter(p => p.category === 'ALL_IN_ONE');
      
      // Determine if user can upgrade to ALL_IN_ONE
      const canUpgradeToAllInOne = currentSubscriptions.length === 1;
      const needsCancellationFirst = canUpgradeToAllInOne 
        ? [] 
        : currentSubscriptions.filter(s => s.id !== subscription.id);

      return {
        subscriptionId: subscription.id,
        currentPlan,
        upgrades: sameCategoryPlans.filter(p => p.billing_cycle > currentPlan.billing_cycle),
        downgrades: sameCategoryPlans.filter(p => p.billing_cycle < currentPlan.billing_cycle),
        allInOneOptions: allInOnePlans,
        canUpgradeToAllInOne,
        needsCancellationFirst,
      };
    });

    return {
      data: {
        currentSubscriptions,
        availableChanges,
      },
    };
  } catch (error) {
    console.error('Get available plan changes error:', error);
    return { error: 'Failed to get available plan changes' };
  }
};

export const getAvailablePlanChanges = createSafeAction(
  GetAvailablePlanChangesSchema,
  handler
); 