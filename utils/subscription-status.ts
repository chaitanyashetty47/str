import { Prisma } from '@prisma/client';

/**
 * Subscription Status Precedence Management
 * 
 * Handles status transitions for user subscriptions to ensure consistent state
 * even when Razorpay webhook events arrive out of order.
 */



export type SubscriptionStatus = 
  | 'CREATED'
  | 'PENDING' 
  | 'AUTHENTICATED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'HALTED'
  | 'EXPIRED'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Status precedence map - higher numbers take priority
 * Only allow "upgrades" to higher precedence statuses unless explicitly allowed
 * 
 * Special recovery rules:
 * - PENDING can upgrade to ACTIVE (retry success)
 * - HALTED can upgrade to ACTIVE (customer fixes payment)
 */
const STATUS_PRECEDENCE: Record<SubscriptionStatus, number> = {
  CREATED: 0,
  PENDING: 0,      // Same level as CREATED
  AUTHENTICATED: 1,
  ACTIVE: 2,
  PAUSED: 3,       // Can pause an active subscription
  HALTED: 3,       // System halt due to failures (can recover to ACTIVE)
  COMPLETED: 4,    // Final states
  EXPIRED: 4,      // Final states
  CANCELLED: 4,    // Final states
} as const;

/**
 * Explicitly allowed downgrades for failure scenarios
 * These transitions are permitted even though they go to lower precedence statuses
 */
const ALLOWED_DOWNGRADES: Array<{
  from: SubscriptionStatus;
  to: SubscriptionStatus;
  reason: string;
}> = [
  {
    from: 'ACTIVE',
    to: 'PENDING',
    reason: 'Payment failure - entering retry cycle'
  },
  {
    from: 'PENDING', 
    to: 'HALTED',
    reason: 'Multiple payment failures - subscription halted'
  },
  {
    from: 'ACTIVE',
    to: 'PAUSED',
    reason: 'User or system paused subscription'
  }
] as const;

/**
 * Check if a status transition is allowed (upgrade or explicitly allowed downgrade)
 * Includes special recovery rules and explicit downgrade permissions
 * @param currentStatus - Current subscription status
 * @param newStatus - Proposed new status
 * @returns true if the transition is allowed, false otherwise
 */
export function isStatusUpgrade(
  currentStatus: SubscriptionStatus, 
  newStatus: SubscriptionStatus
): boolean {
  const currentRank = STATUS_PRECEDENCE[currentStatus];
  const newRank = STATUS_PRECEDENCE[newStatus];
  
  // Check for explicitly allowed downgrades first
  const allowedDowngrade = ALLOWED_DOWNGRADES.find(
    downgrade => downgrade.from === currentStatus && downgrade.to === newStatus
  );
  
  if (allowedDowngrade) {
    return true;
  }
  
  // Special recovery rules: PENDING and HALTED can recover to ACTIVE
  if ((currentStatus === 'PENDING' || currentStatus === 'HALTED') && newStatus === 'ACTIVE') {
    return true;
  }
  
  // Standard upgrade rule: new status must have higher precedence
  return newRank > currentRank;
}

/**
 * Get the precedence rank of a status
 * @param status - Subscription status
 * @returns Numeric precedence rank
 */
export function getStatusPrecedence(status: SubscriptionStatus): number {
  return STATUS_PRECEDENCE[status];
}

/**
 * Check if a transition is an explicitly allowed downgrade
 * @param currentStatus - Current subscription status
 * @param newStatus - Proposed new status
 * @returns Downgrade info if allowed, null otherwise
 */
export function getAllowedDowngrade(
  currentStatus: SubscriptionStatus,
  newStatus: SubscriptionStatus
): { from: SubscriptionStatus; to: SubscriptionStatus; reason: string } | null {
  return ALLOWED_DOWNGRADES.find(
    downgrade => downgrade.from === currentStatus && downgrade.to === newStatus
  ) || null;
}

/**
 * Safely update subscription status only if it's an upgrade
 * @param currentStatus - Current subscription status
 * @param newStatus - Proposed new status
 * @returns The status that should be used (either new or current)
 */
export function getSafeStatusUpdate(
  currentStatus: SubscriptionStatus,
  newStatus: SubscriptionStatus
): SubscriptionStatus {
  if (isStatusUpgrade(currentStatus, newStatus)) {
    return newStatus;
  }
  return currentStatus;
}

/**
 * Log status transition attempts for debugging
 * @param subscriptionId - Subscription ID for logging
 * @param currentStatus - Current status
 * @param newStatus - Attempted new status
 * @param allowed - Whether the transition was allowed
 */
export function logStatusTransition(
  subscriptionId: string,
  currentStatus: SubscriptionStatus,
  newStatus: SubscriptionStatus,
  allowed: boolean
): void {
  const currentRank = STATUS_PRECEDENCE[currentStatus];
  const newRank = STATUS_PRECEDENCE[newStatus];
  
  let reason = 'downgrade/same - ignored';
  
  if (allowed) {
    // Check if it's an allowed downgrade
    const allowedDowngrade = ALLOWED_DOWNGRADES.find(
      downgrade => downgrade.from === currentStatus && downgrade.to === newStatus
    );
    
    if (allowedDowngrade) {
      reason = `allowed downgrade: ${allowedDowngrade.reason}`;
    } else if ((currentStatus === 'PENDING' || currentStatus === 'HALTED') && newStatus === 'ACTIVE') {
      reason = 'recovery to ACTIVE';
    } else if (newRank > currentRank) {
      reason = 'upgrade';
    } else {
      reason = 'same status allowed';
    }
  }
  
  console.log(`Status transition for ${subscriptionId}:`, {
    from: `${currentStatus} (rank ${currentRank})`,
    to: `${newStatus} (rank ${newRank})`,
    allowed,
    reason
  });
} 

/**
 * Safely update subscription status in database with precedence checking
 * @param tx - Prisma transaction client
 * @param subscriptionId - Database subscription ID
 * @param newStatus - Proposed new status
 * @param additionalData - Additional fields to update
 * @returns Updated subscription or null if no update was needed
 */
export async function safeUpdateSubscriptionStatus(
  tx: any, // Prisma transaction client
  subscriptionId: string,
  newStatus: SubscriptionStatus,
  additionalData: Record<string, any> = {}
) {
  // First, get current subscription
  const currentSubscription = await tx.user_subscriptions.findUnique({
    where: { id: subscriptionId },
    select: { id: true, status: true, razorpay_subscription_id: true }
  });

  if (!currentSubscription) {
    throw new Error(`Subscription not found: ${subscriptionId}`);
  }

  const currentStatus = currentSubscription.status as SubscriptionStatus;
  const canUpgrade = isStatusUpgrade(currentStatus, newStatus);

  // Log the transition attempt
  logStatusTransition(
    currentSubscription.razorpay_subscription_id || subscriptionId,
    currentStatus,
    newStatus,
    canUpgrade
  );

  if (canUpgrade) {
    console.log(`✅ Subscription ${subscriptionId} status updated: ${currentStatus} → ${newStatus}`);
    
    return await tx.user_subscriptions.update({
      where: { id: subscriptionId },
      data: {
        status: newStatus,
        ...additionalData
      }
    });
  } else {
    // Check if there's additional data to update even if status remains the same
    if (additionalData && Object.keys(additionalData).length > 0) {
      console.log(`📝 Subscription ${subscriptionId} status unchanged (${currentStatus}), but updating additional fields:`, Object.keys(additionalData));
      
      return await tx.user_subscriptions.update({
        where: { id: subscriptionId },
        data: additionalData
      });
    } else {
      console.log(`⏭️  Subscription ${subscriptionId} status update skipped: ${currentStatus} (keeping current, no additional data)`);
      return null; // No update performed
    }
  }
} 

/**
 * Safely update billing cycle dates to prevent regression to older periods
 * @param currentStart - Current billing cycle start date in database
 * @param currentEnd - Current billing cycle end date in database  
 * @param newStart - New billing cycle start date from webhook
 * @param newEnd - New billing cycle end date from webhook
 * @returns Object with safe dates to update, or null if no update needed
 */
export function getSafeBillingCycleUpdate(
  currentStart: Date | null,
  currentEnd: Date | null,
  newStart: Date | null,
  newEnd: Date | null
): { current_start?: Date | null; current_end?: Date | null } | null {
  // If we don't have current dates, use the new ones
  if (!currentStart || !currentEnd) {
    return {
      current_start: newStart,
      current_end: newEnd
    };
  }

  // If we don't have new dates, don't update
  if (!newStart || !newEnd) {
    return null;
  }

  // Only update if the new billing cycle is newer (starts after current cycle)
  if (newStart.getTime() > currentStart.getTime()) {
    return {
      current_start: newStart,
      current_end: newEnd
    };
  }

  // If new cycle is same or older, don't update
  console.log(`🛡️  Billing cycle regression prevented: Current (${currentStart.toISOString()} - ${currentEnd.toISOString()}) vs New (${newStart.toISOString()} - ${newEnd.toISOString()})`);
  return null;
} 