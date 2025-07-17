'use server';

import { 
  getEffectiveSubscriptionState, 
  getAvailableCategories, 
  getButtonStateForCategory, 
  shouldShowUpgradeOptionsOnly,
  EffectiveSubscriptionState,
  SubscriptionStateResult,
  CategoryButtonState
} from '@/utils/subscription-state';
import { createSafeAction, ActionState } from '@/lib/create-safe-action';
import { SubscriptionCategory } from '@prisma/client';
import { z } from 'zod';

// Schema for getting subscription state
const GetSubscriptionStateSchema = z.object({
  userId: z.string().uuid(),
});

// Schema for getting button state
const GetButtonStateSchema = z.object({
  userId: z.string().uuid(),
  category: z.nativeEnum(SubscriptionCategory),
  planName: z.string(),
});

type GetSubscriptionStateInput = z.infer<typeof GetSubscriptionStateSchema>;
type GetButtonStateInput = z.infer<typeof GetButtonStateSchema>;

// Server action to get subscription state
const getSubscriptionStateHandler = async (
  data: GetSubscriptionStateInput
): Promise<ActionState<GetSubscriptionStateInput, SubscriptionStateResult>> => {
  try {
    const result = await getEffectiveSubscriptionState(data.userId);
    return { data: result };
  } catch (error) {
    console.error('Failed to get subscription state:', error);
    return { error: 'Failed to get subscription state' };
  }
};

// Server action to get available categories
const getAvailableCategoriesHandler = async (
  data: GetSubscriptionStateInput
): Promise<ActionState<GetSubscriptionStateInput, SubscriptionCategory[]>> => {
  try {
    const result = await getAvailableCategories(data.userId);
    return { data: result };
  } catch (error) {
    console.error('Failed to get available categories:', error);
    return { error: 'Failed to get available categories' };
  }
};

// Server action to get button state
const getButtonStateHandler = async (
  data: GetButtonStateInput
): Promise<ActionState<GetButtonStateInput, CategoryButtonState>> => {
  try {
    const result = await getButtonStateForCategory(data.userId, data.category, data.planName);
    return { data: result };
  } catch (error) {
    console.error('Failed to get button state:', error);
    return { error: 'Failed to get button state' };
  }
};

// Server action to check if should show upgrade options only
const shouldShowUpgradeOptionsOnlyHandler = async (
  data: GetSubscriptionStateInput
): Promise<ActionState<GetSubscriptionStateInput, boolean>> => {
  try {
    const result = await shouldShowUpgradeOptionsOnly(data.userId);
    return { data: result };
  } catch (error) {
    console.error('Failed to check upgrade options:', error);
    return { error: 'Failed to check upgrade options' };
  }
};

// Export safe actions
export const getSubscriptionStateAction = createSafeAction(
  GetSubscriptionStateSchema,
  getSubscriptionStateHandler
);

export const getAvailableCategoriesAction = createSafeAction(
  GetSubscriptionStateSchema,
  getAvailableCategoriesHandler
);

export const getButtonStateAction = createSafeAction(
  GetButtonStateSchema,
  getButtonStateHandler
);

export const shouldShowUpgradeOptionsOnlyAction = createSafeAction(
  GetSubscriptionStateSchema,
  shouldShowUpgradeOptionsOnlyHandler
); 