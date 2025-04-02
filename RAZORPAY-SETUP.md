# Razorpay Subscription Integration Setup

This document provides instructions for setting up and testing the Razorpay subscription integration.

## Environment Setup

1. Add the following environment variables to your `.env.local` file:

```
RAZORPAY_KEY_ID=rzp_test_kiKyv4iykNo6gt
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

## Creating Plans in Razorpay Dashboard

Before testing the subscription functionality, you need to create subscription plans in the Razorpay dashboard:

1. Log in to your Razorpay dashboard
2. Navigate to Products > Subscriptions > Plans
3. Create a new plan for each of your subscription tiers
4. For each plan, set:
   - Plan name (matching your app's plan names)
   - Pricing (amount, currency)
   - Billing period (monthly, quarterly, yearly)
   - Billing cycle (how many times to bill)

## Update Database Records

After creating plans in Razorpay, update your `subscription_plans` table with the corresponding Razorpay plan IDs:

```sql
UPDATE subscription_plans 
SET razorpay_plan_id = 'plan_razorpay_id_here'
WHERE id = 'your_plan_id';
```

## Testing Webhooks Locally

To test webhooks locally:

1. Install ngrok: [https://ngrok.com/download](https://ngrok.com/download)
2. Start your Next.js development server:
   ```
   npm run dev
   ```
3. In a separate terminal, start ngrok:
   ```
   ngrok http 3000
   ```
4. Copy the ngrok HTTPS URL (e.g., https://abcd1234.ngrok.io)
5. In the Razorpay dashboard, go to Settings > Webhooks
6. Add a new webhook with:
   - URL: `<ngrok-url>/api/webhooks/razorpay`
   - Events to subscribe: Select all subscription-related events
   - Add the same secret key as in your .env.local file

## Testing Subscriptions

To test the subscription flow:

1. Use Razorpay test cards:
   - Success: 4111 1111 1111 1111
   - Failed: 4000 0000 0000 0002
   - CVV: Any 3-digit number
   - Expiry: Any future date

2. Testing the subscription cancellation:
   - Subscribe to a plan
   - Navigate to your active subscriptions
   - Click the "Cancel Subscription" button

## Checking Subscription Events

You can check the subscription events in your database:

```sql
SELECT * FROM subscription_events ORDER BY created_at DESC;
```

## Troubleshooting

- If webhooks aren't triggering, check the webhook logs in the Razorpay dashboard
- Check your application logs for any errors
- Verify that the webhook URL is correctly configured
- Make sure the webhook secret matches between Razorpay and your .env.local file 