import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleSubscriptionEvent } from '@/actions/subscription.action';

// Webhook signature verification
const verifyRazorpaySignature = (
  body: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    console.error('Error comparing signatures:', error);
    return false;
  }
};

export async function POST(request: NextRequest) {
  try {
    // Log request method and headers for debugging
    console.log('Webhook received:', request.method);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    // Get the raw request body as text (important for signature verification)
    const rawBody = await request.text();
    
    // Debug: log the raw body length
    console.log('Raw body length:', rawBody.length);
    
    // Check if body is empty
    if (!rawBody || rawBody.trim() === '') {
      console.error('Empty request body received');
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }
    
    // Try to parse the body as JSON
    let payload;
    try {
      payload = JSON.parse(rawBody);
      console.log('Parsed webhook payload event type:', payload.event);
    } catch (error) {
      console.error('Error parsing webhook payload:', error);
      console.error('Raw payload:', rawBody);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Get the signature from headers
    const signature = request.headers.get('x-razorpay-signature');
    
    // Debug: log if signature exists
    console.log('Signature present:', !!signature);
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }
    
    // Verify the signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    const isValid = verifyRazorpaySignature(rawBody, signature, webhookSecret);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Extract event type from the webhook payload
    const eventType = payload.event;
    
    if (!eventType) {
      console.error('Missing event type in payload');
      console.log('Payload structure:', JSON.stringify(payload, null, 2));
      return NextResponse.json(
        { error: 'Missing event type' },
        { status: 400 }
      );
    }
    
    // Process the subscription event
    const result = await handleSubscriptionEvent(payload);
    
    if (result.error) {
      console.error(`Error processing webhook event ${eventType}:`, result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    // Return a 200 response to acknowledge the webhook
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
