import prisma from '@/utils/prisma/prismaClient';
import { SubscriptionCategory, SubscriptionStatus } from '@prisma/client';

export enum EffectiveSubscriptionState {
  NO_SUBSCRIPTIONS = 'NO_SUBSCRIPTIONS',
  CANCELLATION_SCHEDULED = 'CANCELLATION_SCHEDULED', 
  ACTIVE_SUBSCRIPTIONS = 'ACTIVE_SUBSCRIPTIONS',
  MIXED_STATE = 'MIXED_STATE'
}

export interface SubscriptionStateResult {
  state: EffectiveSubscriptionState;
  activeSubscriptions: any[];
  scheduledCancellations: any[];
  availableCategories: SubscriptionCategory[];
  hasActiveSubscriptions: boolean;
  hasScheduledCancellations: boolean;
}

export interface CategoryButtonState {
  category: SubscriptionCategory;
  buttonText: string;
  buttonAction: 'subscribe' | 'disabled' | 'change_plan';
  isDisabled: boolean;
  disabledReason?: string;
  hasCurrentPlan: boolean;
}

/**
 * Get the effective subscription state for a user
 */
export async function getEffectiveSubscriptionState(userId: string): Promise<SubscriptionStateResult> {
  // Get all user subscriptions with their plans
  const subscriptions = await prisma.user_subscriptions.findMany({
    where: {
      user_id: userId,
      status: { in: ['ACTIVE', 'CREATED', 'AUTHENTICATED', 'PENDING'] }
    },
    include: {
      subscription_plans: true
    }
  });

  // Separate active vs scheduled for cancellation
  const activeSubscriptions = subscriptions.filter(sub => !sub.cancel_at_cycle_end);
  const scheduledCancellations = subscriptions.filter(sub => sub.cancel_at_cycle_end);

  // Determine state
  let state: EffectiveSubscriptionState;
  if (subscriptions.length === 0) {
    state = EffectiveSubscriptionState.NO_SUBSCRIPTIONS;
  } else if (activeSubscriptions.length === 0 && scheduledCancellations.length > 0) {
    state = EffectiveSubscriptionState.CANCELLATION_SCHEDULED;
  } else if (activeSubscriptions.length > 0 && scheduledCancellations.length === 0) {
    state = EffectiveSubscriptionState.ACTIVE_SUBSCRIPTIONS;
  } else {
    state = EffectiveSubscriptionState.MIXED_STATE;
  }

  // Get available categories (categories without active subscriptions)
  const activeCategories = activeSubscriptions.map(sub => sub.subscription_plans.category);
  const allCategories = Object.values(SubscriptionCategory);
  const availableCategories = allCategories.filter(cat => !activeCategories.includes(cat));

  return {
    state,
    activeSubscriptions,
    scheduledCancellations,
    availableCategories,
    hasActiveSubscriptions: activeSubscriptions.length > 0,
    hasScheduledCancellations: scheduledCancellations.length > 0
  };
}

/**
 * Get available categories that user can subscribe to
 */
export async function getAvailableCategories(userId: string): Promise<SubscriptionCategory[]> {
  const stateResult = await getEffectiveSubscriptionState(userId);
  return stateResult.availableCategories;
}

/**
 * Get button state for a specific category based on user's subscriptions
 */
export async function getButtonStateForCategory(
  userId: string, 
  category: SubscriptionCategory,
  planName: string
): Promise<CategoryButtonState> {
  const stateResult = await getEffectiveSubscriptionState(userId);
  
  // Check if user has active subscription in this category
  const hasActivePlan = stateResult.activeSubscriptions.some(
    sub => sub.subscription_plans.category === category
  );
  
  // Check if user has scheduled cancellation in this category
  const hasScheduledCancellation = stateResult.scheduledCancellations.some(
    sub => sub.subscription_plans.category === category
  );

  if (hasActivePlan) {
    return {
      category,
      buttonText: 'Change Plan',
      buttonAction: 'change_plan',
      isDisabled: false,
      hasCurrentPlan: true
    };
  }

  if (hasScheduledCancellation) {
    const cancelSub = stateResult.scheduledCancellations.find(
      sub => sub.subscription_plans.category === category
    );
    const endDate = cancelSub?.current_end ? new Date(cancelSub.current_end).toLocaleDateString() : 'soon';
    
    return {
      category,
      buttonText: `Ends ${endDate}`,
      buttonAction: 'disabled',
      isDisabled: true,
      disabledReason: `Current plan ends on ${endDate}. Wait for cancellation to complete.`,
      hasCurrentPlan: false
    };
  }

  // Category is available for subscription
  return {
    category,
    buttonText: `Subscribe to ${planName}`,
    buttonAction: 'subscribe',
    isDisabled: false,
    hasCurrentPlan: false
  };
}

/**
 * Check if user should see upgrade options only (all categories subscribed)
 */
export async function shouldShowUpgradeOptionsOnly(userId: string): Promise<boolean> {
  const availableCategories = await getAvailableCategories(userId);
  return availableCategories.length === 0;
} 