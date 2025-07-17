export interface RazorpayAPISubscription {
  id: string;
  entity: 'subscription';
  plan_id: string;
  status: 'created' | 'active' | 'completed' | 'cancelled';
  customer_id: string | null;
  current_start: number;
  current_end: number;
  ended_at: number | null;
  quantity: number;
  notes: {
    user_id: string;
    plan_name: string;
    plan_id: string;
    razorpay_plan_id: string;
  };
  auth_attempts: number;
  total_count: number | null;
  paid_count: number;
  amount?: number;
  amount_paid?: number;
  amount_due?: number;
  total_credits_used?: number;
  remaining_count: number | null;
  created_at: number;
  expire_by: number;
  short_url: string;
  has_scheduled_changes: boolean;
  change_scheduled_at: number | null;
  source: string;
  change_pending_at?: number | null;

  // Common additional fields seen in webhook/REST responses
  charge_at?: number | null;
  start_at?: number | null;
  end_at?: number | null;
  customer_notify?: boolean;
  offer_id?: string | null;
  type?: number;

  // Allow any extra keys Razorpay may add without breaking our types
  [key: string]: any;
}

// ---------------------------------------------
// Razorpay Webhook Types (Subscriptions)
// ---------------------------------------------

export type RazorpaySubscriptionEventType =
  | 'subscription.charged'
  | 'subscription.activated'
  | 'subscription.authenticated'
  | 'subscription.cancelled'
  | 'subscription.completed'
  | 'subscription.paused'
  | 'subscription.halted'
  | 'subscription.pending'
  | 'subscription.updated';

/**
 * Minimal representation of the Razorpay Payment entity used in webhook payloads.
 * Extend as required when you need more payment fields.
 */
export interface RazorpayAPIPayment {
  id: string;
  entity: 'payment';
  amount: number; // amount in paise
  currency: string;
  status: string;
  [key: string]: any; // allow additional fields that we don't currently model
}

/**
 * Webhook payload structure for subscription-related events.
 * Fields that appear for all events are required, while event-specific
 * blocks (like `payment`) are optional.
 */
export interface RazorpaySubscriptionWebhookPayload {
  entity: 'event';
  event: RazorpaySubscriptionEventType;
  created_at: number; // Unix timestamp (seconds)
  payload: {
    subscription: {
      entity: RazorpayAPISubscription;
    };
    payment?: {
      entity: RazorpayAPIPayment;
    };
  };
}