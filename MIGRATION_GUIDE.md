# Database Migration Guide

## 🚨 **IMPORTANT: Follow this order exactly**

## Step 1: Backup Your Subscription Plans Data

### Option A: Using Database Query Tool
Run this SQL in your database management tool (pgAdmin, DBeaver, etc.):

```sql
-- Create backup table
CREATE TABLE subscription_plans_backup AS 
SELECT * FROM subscription_plans;

-- Verify backup
SELECT COUNT(*) FROM subscription_plans_backup;
```

### Option B: Using Prisma Studio or psql
```bash
# Connect to your database
psql $DATABASE_URL

# Run the backup commands from backup-subscription-plans.sql
\i backup-subscription-plans.sql
```

## Step 2: Generate and Apply Migration

### 2.1 Generate Prisma Client
```bash
# Generate new Prisma client
npx prisma generate
```

### 2.2 Reset Database (⚠️ This will delete all data)
```bash
# Reset database and apply new schema
npx prisma db push --force-reset
```

**Alternative (if you want to keep some data):**
```bash
# Generate migration file first
npx prisma migrate dev --create-only --name "new_schema_migration"

# Edit the migration file if needed, then apply
npx prisma migrate dev
```

## Step 3: Restore Subscription Plans Data

### 3.1 Using Prisma Studio
1. Open Prisma Studio: `npx prisma studio`
2. Navigate to SubscriptionPlan table
3. Manually add the subscription plans

### 3.2 Using SQL Script
```sql
-- Insert your subscription plans back
INSERT INTO "SubscriptionPlan" (
  id,
  name,
  category,
  "planType",
  price,
  features,
  "razorpayPlanId",
  "billingPeriod",
  "billingCycle"
) VALUES 
('0479838746', 'Resilience', 'PSYCHOLOGY', 'ONLINE', 18000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('24f715831c', 'Diamond Level', 'FITNESS', 'IN_PERSON', 50000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('3598f70e4b', 'Abundance', 'MANIFESTATION', 'ONLINE', 14000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('4e23be2e0c', 'Quantum Level', 'MANIFESTATION', 'ONLINE', 20000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('60cbf6651f', 'Growth Mindset', 'PSYCHOLOGY', 'ONLINE', 12000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('6f24408fba', 'Basic Clarity', 'PSYCHOLOGY', 'ONLINE', 6000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('7fe5d6cc1c', 'Silver Plan', 'FITNESS', 'ONLINE', 18000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('acf37fe040', 'Vision Star', 'MANIFESTATION', 'ONLINE', 7000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('d41dd8d1d4', 'Gold Plan', 'FITNESS', 'ONLINE', 30000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('d62e470357', 'Self-Paced', 'FITNESS', 'SELF_PACED', 2000, '{"name": "plan_QDC"}', NULL, 'monthly', 1),
('efc30547b9', 'Platinum Level', 'FITNESS', 'IN_PERSON', 40000, '{"name": "plan_QDC"}', NULL, 'monthly', 1);
```

### 3.3 Using TypeScript/Node.js Script
```typescript
// restore-subscription-plans.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function restoreSubscriptionPlans() {
  const plans = [
    {
      id: '0479838746',
      name: 'Resilience',
      category: 'PSYCHOLOGY',
      planType: 'ONLINE',
      price: 18000,
      features: { name: 'plan_QDC' },
      billingPeriod: 'monthly',
      billingCycle: 1
    },
    // ... add all other plans
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.create({
      data: plan
    })
  }

  console.log('✅ Subscription plans restored')
}

restoreSubscriptionPlans()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## Step 4: Verify Migration

### 4.1 Check Schema
```bash
# Verify schema is applied correctly
npx prisma db pull
npx prisma generate
```

### 4.2 Check Data
```sql
-- Verify subscription plans are restored
SELECT id, name, category, "planType", price FROM "SubscriptionPlan";

-- Check new tables exist
\dt public.*;
```

### 4.3 Test Application
```bash
# Start your application and test
npm run dev
# or
yarn dev
```

## Step 5: Update Your Application Code

### 5.1 Update Prisma Client Usage
```typescript
// Old (snake_case)
const plans = await prisma.subscription_plans.findMany()

// New (PascalCase)  
const plans = await prisma.subscriptionPlan.findMany()
```

### 5.2 Update Field Names
```typescript
// Old field names
user.auth_user_id
user.created_at
plan.plan_type
plan.razorpay_plan_id

// New field names
user.authUserId
user.createdAt
plan.planType
plan.razorpayPlanId
```

## Step 6: Seed Initial Data (Optional)

### 6.1 Create Exercise List
```typescript
// Add some basic exercises
await prisma.workoutExerciseList.createMany({
  data: [
    { name: 'Push-ups', type: 'CHEST', createdById: adminUserId },
    { name: 'Squats', type: 'LEGS', createdById: adminUserId },
    { name: 'Pull-ups', type: 'BACK', createdById: adminUserId },
    // ... more exercises
  ]
})
```

## ⚠️ **Troubleshooting**

### Issue: Migration Fails
```bash
# If migration fails, you can force reset
npx prisma db push --force-reset --accept-data-loss
```

### Issue: Prisma Client Not Updated
```bash
# Regenerate client
rm -rf node_modules/.prisma
npx prisma generate
```

### Issue: Type Errors in Code
1. Update all model references from snake_case to PascalCase
2. Update all field references from snake_case to camelCase
3. Regenerate Prisma client: `npx prisma generate`

## 🎉 **Success Checklist**

- [ ] Subscription plans data backed up
- [ ] New schema applied successfully
- [ ] Subscription plans data restored
- [ ] Application starts without errors
- [ ] Can create/read users with new fields
- [ ] Calculator functionality works
- [ ] Weight logging works

## **Summary of Changes**

### **New Features Added:**
- ✅ International user support (weight/height units)
- ✅ Enhanced user onboarding fields
- ✅ Calculator system with session tracking
- ✅ Weight logging with historical data
- ✅ Exercise master list for reusability
- ✅ Cleaner workout plan structure
- ✅ Gender enum for data consistency

### **Models Removed:**
- ❌ `exercise` (replaced with `WorkoutExerciseList`)
- ❌ `exercises_workout` (replaced with `WorkoutDayExercise`)
- ❌ `user_workout_logs` (replaced with `ExerciseLog`)
- ❌ `profiles` (data moved to `User` model)
- ❌ `user_body_measurements` (replaced with `WeightLog`)
- ❌ All old workout-related tables

### **Models Renamed:**
- `users` → `User`
- `subscription_plans` → `SubscriptionPlan`
- `user_subscriptions` → `UserSubscription`
- `subscription_events` → `SubscriptionEvent`
- `transformation_photos` → `TransformationPhoto`
- `webhook_events` → `WebhookEvent`

Your new schema is now ready for international users and provides a much cleaner architecture! 🚀 