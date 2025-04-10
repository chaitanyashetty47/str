import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleSubscriptionEvent } from '@/actions/subscription.action';

// Improved webhook signature verification with timing-safe equals
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

// Check if event is already processed (idempotency check)
const isEventProcessed = async (eventId: string, supabase: any): Promise<boolean> => {
  const { data, error } = await supabase
    .from('subscription_events')
    .select('id')
    .eq('metadata->event_id', eventId)
    .single();
  
  return !error && data !== null;
};

export async function POST(request: NextRequest) {
  try {
    // Get the raw request body as text (important for signature verification)
    const rawBody = await request.text();
    
    // Check if body is empty
    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json(
        { error: 'Empty request body' },
        { status: 400 }
      );
    }
    
    // Try to parse the body as JSON
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    // Get the signature from headers
    const signature = request.headers.get('x-razorpay-signature');
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }
    
    // Verify the signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    
    const isValid = verifyRazorpaySignature(rawBody, signature, webhookSecret);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    // Extract event type and ID from the webhook payload
    const eventType = payload.event;
    const eventId = payload.id || `${payload.event}_${payload.created_at}`;
    
    if (!eventType) {
      return NextResponse.json(
        { error: 'Missing event type' },
        { status: 400 }
      );
    }
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Check if this event was already processed (idempotency)
    if (await isEventProcessed(eventId, supabase)) {
      return NextResponse.json({ 
        success: true,
        message: 'Event already processed' 
      });
    }
    
    // Process the subscription event
    const result = await handleSubscriptionEvent(payload);
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    // Store the event to prevent duplicate processing using the correct schema
    await supabase.from('subscription_events').insert({
      event_type: eventType,
      // Extract user_id from the payload if available
      user_id: payload.payload?.subscription?.entity?.customer_id || 
               payload.payload?.subscription?.entity?.notes?.user_id || null,
      // Use metadata to store the event details for idempotency
      metadata: {
        event_id: eventId,
        processed_at: new Date().toISOString(),
        payload_summary: {
          event: payload.event,
          account_id: payload.account_id,
          contains: payload.contains
        }
      }
    });
    
    // Return a 200 response to acknowledge the webhook
    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't expose detailed error information
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
