import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '@/utils/prisma/prismaClient';

interface CleanupOptions {
  subscriptionId: string;
  userId: string;
  reason: 'user_dismissed_payment_modal' | 'payment_failed' | 'manual_cancellation';
}

export async function cleanupFailedSubscription({ subscriptionId, userId, reason }: CleanupOptions) {
  try {
    // Find the subscription in our database
    const subscription = await prisma.user_subscriptions.findFirst({
      where: {
        razorpay_subscription_id: subscriptionId,
        user_id: userId,
        status: { in: ['CREATED', 'PENDING', 'AUTHENTICATED'] }
      }
    });
    
    if (!subscription) {
      console.log(`Subscription not found or already processed: ${subscriptionId}`);
      return { success: false, message: 'Subscription not found or already processed' };
    }
    
    // Initialize Razorpay
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }
    
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    
    // Try to cancel in Razorpay (best effort)
    try {
      await razorpay.subscriptions.cancel(subscriptionId, false);
      console.log(`Razorpay subscription cancelled: ${subscriptionId}`);
    } catch (razorpayError) {
      console.error('Error cancelling Razorpay subscription:', razorpayError);
      // Continue with database cleanup even if Razorpay fails
    }
    
    // Update subscription status in database
    await prisma.$transaction(async (tx) => {
      // Update subscription
      await tx.user_subscriptions.update({
        where: { id: subscription.id },
        data: {
          status: 'CANCELLED',
          payment_status: 'FAILED',
          end_date: new Date()
        }
      });
      
      // Log the cancellation event
      await tx.subscription_events.create({
        data: {
          id: crypto.randomUUID(),
          event_type: 'subscription.cancelled',
          user_id: userId,
          subscription_plan_id: subscription.plan_id,
          metadata: {
            razorpay_subscription_id: subscriptionId,
            cancellation_reason: reason,
            cancelled_at: new Date().toISOString()
          }
        }
      });
    });
    
    console.log(`Subscription cleanup completed: ${subscription.id}`);
    
    return { 
      success: true, 
      message: 'Subscription cancelled successfully',
      subscriptionId: subscription.id 
    };
    
  } catch (error) {
    console.error('Error during subscription cleanup:', error);
    throw error;
  }
}

// Clean up orphaned subscriptions (subscriptions created but never activated)
export async function cleanupOrphanedSubscriptions() {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 1); // 1 hour ago
    
    const orphanedSubscriptions = await prisma.user_subscriptions.findMany({
      where: {
        status: 'CREATED',
        start_date: {
          lt: cutoffTime
        }
      }
    });
    
    console.log(`Found ${orphanedSubscriptions.length} orphaned subscriptions`);
    
    for (const subscription of orphanedSubscriptions) {
      try {
        await cleanupFailedSubscription({
          subscriptionId: subscription.razorpay_subscription_id!,
          userId: subscription.user_id,
          reason: 'payment_failed'
        });
      } catch (error) {
        console.error(`Failed to cleanup orphaned subscription ${subscription.id}:`, error);
      }
    }
    
    return { cleaned: orphanedSubscriptions.length };
  } catch (error) {
    console.error('Error cleaning up orphaned subscriptions:', error);
    throw error;
  }
} 