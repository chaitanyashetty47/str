# Redis + Logger Setup for Webhook Processing

## 🎯 Overview
This document outlines the comprehensive Redis-based webhook processing system with structured logging for reliable Razorpay subscription event handling.

## 📦 Dependencies

```bash
npm install ioredis @types/ioredis winston @types/winston
npm install @sentry/nextjs  # Optional: Error tracking
```

## 🔧 Environment Variables

```bash
# .env.local (Development)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# .env (Production)
REDIS_URL=redis://username:password@host:port

# Webhook Processing
WEBHOOK_PROCESSING_ENABLED=true
LOG_LEVEL=info

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn_here
ADMIN_EMAIL=your-email@domain.com
```

## 🏗️ File Structure

```
utils/redis/
├── client.ts              # Redis connection setup
├── queue.ts               # Queue operations (enqueue/dequeue)
├── webhook-dedup.ts       # Deduplication logic
└── metrics.ts             # Queue metrics collection

lib/
├── logging.ts             # Winston logger configuration
├── webhook-processor.ts   # Core event processing logic
└── monitoring/
    ├── sentry.ts          # Error tracking setup
    ├── metrics.ts         # Custom metrics
    └── alerts.ts          # Email alerts

app/api/cron/
├── process-webhooks-high/route.ts    # High priority (5s interval)
├── process-webhooks-std/route.ts     # Standard priority (30s interval)
├── process-webhooks-batch/route.ts   # Batch processing (2min interval)
└── reconcile-daily/route.ts          # Daily reconciliation

app/api/admin/
├── webhook-dashboard/route.ts        # Metrics dashboard
├── queue-status/route.ts            # Queue monitoring
└── failed-events/route.ts           # Failed event viewer
```

## 🔄 Redis Queue Structure

### Queue Keys
```typescript
// Event Queues by Priority
webhook:events:high        // subscription.charged (immediate)
webhook:events:standard    // subscription.activated, authenticated
webhook:events:batch       // subscription.cancelled, completed

// Processing State
webhook:processing:{id}    // Currently being processed
webhook:failed:{id}        // Failed after all retries

// Deduplication
webhook:dedup:{webhook_id}:{subscription_id}  // 24hr TTL

// Metrics
webhook:metrics:daily      // Daily statistics
webhook:metrics:hourly     // Hourly statistics
```

### Event Structure
```typescript
interface QueuedWebhookEvent {
  id: string;
  webhook_id: string;
  event_type: string;
  subscription_id: string;
  payload: any;
  priority: 'high' | 'standard' | 'batch';
  retry_count: number;
  max_retries: number;
  scheduled_at: Date;
  created_at: Date;
  last_error?: string;
}
```

## 🚀 Implementation Files

### 1. Redis Client (`utils/redis/client.ts`)
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keyPrefix: 'strentor:',
});

redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

export default redis;
```

### 2. Queue Operations (`utils/redis/queue.ts`)
```typescript
import redis from './client';
import logger from '@/lib/logging';

export class WebhookQueue {
  static async enqueue(event: QueuedWebhookEvent): Promise<void> {
    const queueKey = `webhook:events:${event.priority}`;
    
    await redis.lpush(queueKey, JSON.stringify(event));
    
    logger.info('Event queued', {
      event_id: event.id,
      event_type: event.event_type,
      priority: event.priority,
      subscription_id: event.subscription_id
    });
  }

  static async dequeue(priority: string): Promise<QueuedWebhookEvent | null> {
    const queueKey = `webhook:events:${priority}`;
    const eventData = await redis.rpop(queueKey);
    
    if (!eventData) return null;
    
    return JSON.parse(eventData);
  }

  static async getQueueLength(priority: string): Promise<number> {
    const queueKey = `webhook:events:${priority}`;
    return await redis.llen(queueKey);
  }

  static async markProcessing(eventId: string): Promise<void> {
    await redis.setex(`webhook:processing:${eventId}`, 300, Date.now().toString());
  }

  static async markCompleted(eventId: string): Promise<void> {
    await redis.del(`webhook:processing:${eventId}`);
  }

  static async markFailed(event: QueuedWebhookEvent, error: string): Promise<void> {
    await redis.setex(
      `webhook:failed:${event.id}`, 
      86400, // 24 hours
      JSON.stringify({ ...event, error, failed_at: new Date() })
    );
  }
}
```

### 3. Deduplication (`utils/redis/webhook-dedup.ts`)
```typescript
import redis from './client';

export class WebhookDeduplication {
  static async isDuplicate(webhookId: string, subscriptionId: string): Promise<boolean> {
    const key = `webhook:dedup:${webhookId}:${subscriptionId}`;
    const exists = await redis.exists(key);
    return exists === 1;
  }

  static async markProcessed(webhookId: string, subscriptionId: string): Promise<void> {
    const key = `webhook:dedup:${webhookId}:${subscriptionId}`;
    await redis.setex(key, 86400, Date.now().toString()); // 24hr TTL
  }
}
```

### 4. Structured Logging (`lib/logging.ts`)
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'strentor-webhooks',
    environment: process.env.NODE_ENV 
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// In production, add file transport or external service
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/webhook-errors.log',
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/webhook-combined.log'
  }));
}

export default logger;
```

### 5. Enhanced Webhook Receiver (`app/api/webhooks/razorpay/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { WebhookQueue } from '@/utils/redis/queue';
import { WebhookDeduplication } from '@/utils/redis/webhook-dedup';
import logger from '@/lib/logging';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let webhookId: string | null = null;
  
  try {
    // Extract webhook metadata
    webhookId = request.headers.get("x-razorpay-event-id");
    const signature = request.headers.get("x-razorpay-signature");
    
    if (!webhookId) {
      return NextResponse.json({ error: "Missing webhook ID" }, { status: 400 });
    }

    // Get raw body for signature verification
    const body = await request.text();
    const payload = JSON.parse(body);
    
    // Verify signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) {
      logger.error('Webhook signature verification failed', { webhookId });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
      logger.error('Invalid webhook signature', { webhookId });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Extract event details
    const eventType = payload.event;
    const subscriptionId = payload.payload?.subscription?.entity?.id;
    
    if (!subscriptionId) {
      logger.warn('Webhook missing subscription ID', { webhookId, eventType });
      return NextResponse.json({ error: "Missing subscription ID" }, { status: 400 });
    }

    // Check for duplicates
    const isDuplicate = await WebhookDeduplication.isDuplicate(webhookId, subscriptionId);
    if (isDuplicate) {
      logger.info('Duplicate webhook ignored', { webhookId, subscriptionId, eventType });
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Determine priority
    const priority = eventType === 'subscription.charged' ? 'high' : 
                    eventType.includes('subscription.activated') || 
                    eventType.includes('subscription.authenticated') ? 'standard' : 'batch';

    // Queue the event
    const queuedEvent = {
      id: crypto.randomUUID(),
      webhook_id: webhookId,
      event_type: eventType,
      subscription_id: subscriptionId,
      payload,
      priority,
      retry_count: 0,
      max_retries: 5,
      scheduled_at: new Date(),
      created_at: new Date()
    };

    await WebhookQueue.enqueue(queuedEvent);
    await WebhookDeduplication.markProcessed(webhookId, subscriptionId);

    const processingTime = Date.now() - startTime;
    logger.info('Webhook queued successfully', {
      webhookId,
      eventType,
      subscriptionId,
      priority,
      processingTime
    });

    return NextResponse.json({ 
      received: true, 
      queued: true, 
      priority,
      processing_time: processingTime 
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('Webhook processing failed', {
      webhookId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime
    });
    
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
```

### 6. Cron Job Configuration (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/process-webhooks-high",
      "schedule": "*/5 * * * * *"
    },
    {
      "path": "/api/cron/process-webhooks-std",
      "schedule": "*/30 * * * * *"
    },
    {
      "path": "/api/cron/process-webhooks-batch",
      "schedule": "*/2 * * * *"
    },
    {
      "path": "/api/cron/reconcile-daily",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 7. High Priority Processor (`app/api/cron/process-webhooks-high/route.ts`)
```typescript
import { NextResponse } from 'next/server';
import { WebhookQueue } from '@/utils/redis/queue';
import { processChargedEvent } from '@/actions/webhooks/process-charged-event';
import logger from '@/lib/logging';

export async function GET() {
  const startTime = Date.now();
  let processedCount = 0;
  
  try {
    // Process up to 10 high priority events per run
    for (let i = 0; i < 10; i++) {
      const event = await WebhookQueue.dequeue('high');
      if (!event) break;

      try {
        await WebhookQueue.markProcessing(event.id);
        
        if (event.event_type === 'subscription.charged') {
          await processChargedEvent(event);
        }
        
        await WebhookQueue.markCompleted(event.id);
        processedCount++;
        
        logger.info('High priority event processed', {
          event_id: event.id,
          event_type: event.event_type,
          subscription_id: event.subscription_id
        });
        
      } catch (error) {
        event.retry_count++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (event.retry_count <= event.max_retries) {
          // Re-queue with exponential backoff
          event.scheduled_at = new Date(Date.now() + Math.pow(2, event.retry_count) * 1000);
          await WebhookQueue.enqueue(event);
        } else {
          await WebhookQueue.markFailed(event, errorMessage);
        }
        
        logger.error('High priority event failed', {
          event_id: event.id,
          error: errorMessage,
          retry_count: event.retry_count
        });
      }
    }

    const processingTime = Date.now() - startTime;
    return NextResponse.json({ 
      processed: processedCount,
      processing_time: processingTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('High priority processor failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json({ error: 'Processor failed' }, { status: 500 });
  }
}
```

### 8. Admin Dashboard API (`app/api/admin/webhook-dashboard/route.ts`)
```typescript
import { NextResponse } from 'next/server';
import { WebhookQueue } from '@/utils/redis/queue';
import redis from '@/utils/redis/client';

export async function GET() {
  try {
    const [highQueue, standardQueue, batchQueue] = await Promise.all([
      WebhookQueue.getQueueLength('high'),
      WebhookQueue.getQueueLength('standard'),
      WebhookQueue.getQueueLength('batch')
    ]);

    const processingKeys = await redis.keys('webhook:processing:*');
    const failedKeys = await redis.keys('webhook:failed:*');

    const metrics = {
      queues: {
        high: highQueue,
        standard: standardQueue,
        batch: batchQueue
      },
      processing: processingKeys.length,
      failed: failedKeys.length,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(metrics);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
```

## 🚨 Monitoring & Alerts

### Error Tracking with Sentry
```typescript
// lib/monitoring/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

export { Sentry };
```

### Email Alerts
```typescript
// lib/monitoring/alerts.ts
import { sendEmail } from '@/utils/email';
import logger from '@/lib/logging';

export async function alertCriticalFailure(event: any, error: string) {
  if (event.retry_count >= event.max_retries) {
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL!,
        subject: `🚨 Critical: Webhook processing failed for ${event.subscription_id}`,
        html: `
          <h3>Webhook Processing Failure</h3>
          <p><strong>Event Type:</strong> ${event.event_type}</p>
          <p><strong>Subscription ID:</strong> ${event.subscription_id}</p>
          <p><strong>Error:</strong> ${error}</p>
          <p><strong>Retry Count:</strong> ${event.retry_count}</p>
          <p><strong>Failed At:</strong> ${new Date().toISOString()}</p>
        `
      });
    } catch (emailError) {
      logger.error('Failed to send alert email', { emailError });
    }
  }
}
```

## 📊 Testing Strategy

### Local Development Testing
```bash
# 1. Start Redis
docker run -d --name redis-strentor -p 6379:6379 redis:alpine

# 2. Test webhook reception
curl -X POST http://localhost:3000/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "x-razorpay-event-id: test-webhook-123" \
  -H "x-razorpay-signature: test-signature" \
  -d '{"event": "subscription.charged", "payload": {"subscription": {"entity": {"id": "sub_123"}}}}'

# 3. Check queue status
curl http://localhost:3000/api/admin/webhook-dashboard

# 4. Manually process queue
curl http://localhost:3000/api/cron/process-webhooks-high
```

## 🚀 Implementation Timeline

- **Week 1**: Redis setup + Basic queue operations
- **Week 2**: Enhanced webhook receiver + High priority processor  
- **Week 3**: Standard/Batch processors + State machine
- **Week 4**: Monitoring, dashboard, and reconciliation

## 📝 Notes

- This setup provides enterprise-grade reliability for webhook processing
- Redis queues ensure no webhook events are lost
- Structured logging enables easy debugging and monitoring
- Cron-based processing works seamlessly with Vercel deployment
- The system is designed to handle high webhook volumes without blocking
