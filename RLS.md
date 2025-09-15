# Row Level Security (RLS) Policies

## Overview

This document contains comprehensive Row Level Security policies for all tables in our fitness training application. These policies work in conjunction with the RBAC system to provide database-level access control.

## Policy Principles

### Access Control Matrix

| Role    | Own Data | Client Data | All Data | System Data |
|---------|----------|-------------|----------|-------------|
| CLIENT  | ✅ R/W   | ❌          | ❌       | ❌          |
| TRAINER | ✅ R/W   | ✅ R/W*     | ❌       | ❌          |
| ADMIN   | ✅ R/W   | ✅ R/W      | ✅ R/W   | ✅ R/W      |

*Only assigned clients

### JWT Claims Structure

The RLS policies rely on JWT claims provided by our custom auth hook. The expected JWT structure is:

```json
{
  "sub": "supabase-auth-user-id",
  "user_role": "CLIENT|TRAINER|ADMIN",
  "subscriptions": {
    "FITNESS": {
      "status": "ACTIVE",
      "plan_id": "subscription-plan-id",
      "plan_name": "Plan Name",
      "plan_type": "ONLINE|IN_PERSON|SELF_PACED",
      "start_date": "2024-01-01",
      "end_date": "2024-12-31"
    },
    "PSYCHOLOGY": { /* ... */ },
    "MANIFESTATION": { /* ... */ },
    "platform_access": "full" // For TRAINER/ADMIN roles
  },
  "user_internal_id": "internal-user-table-id",
  "profile_completed": true
}
```

**Key Points:**
- `user_role`: Determines basic access level (CLIENT, TRAINER, ADMIN)
- `subscriptions`: Object containing active subscriptions by category
- `user_internal_id`: ID from your User table (not Supabase auth ID)
- `profile_completed`: Whether user has completed onboarding

### Helper Functions

First, let's create utility functions for role checking:

```sql
-- Enable RLS on auth.users (if not already enabled)
-- This is needed for our helper functions
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role from JWT
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(auth.jwt() ->> 'user_role', 'CLIENT');
END;
$$;

-- Helper function to get current user's ID from our User table
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_id text;
BEGIN
  SELECT id INTO user_id 
  FROM public."User" 
  WHERE "authUserId" = auth.uid()::text;
  
  RETURN user_id;
END;
$$;

-- Helper function to check if current user is a trainer for specific client
CREATE OR REPLACE FUNCTION public.is_trainer_for_client(client_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  trainer_id text;
  is_trainer boolean := false;
BEGIN
  trainer_id := get_current_user_id();
  
  SELECT EXISTS(
    SELECT 1 FROM public."TrainerClient" 
    WHERE "trainerId" = trainer_id AND "clientId" = client_id
  ) INTO is_trainer;
  
  RETURN is_trainer;
END;
$$;

-- Helper function to check if user can manage workout plan
CREATE OR REPLACE FUNCTION public.can_manage_workout_plan(plan_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  current_user_id text;
  plan_trainer_id text;
  plan_client_id text;
BEGIN
  user_role := get_user_role();
  current_user_id := get_current_user_id();
  
  -- ADMIN can manage any plan
  IF user_role = 'ADMIN' THEN
    RETURN true;
  END IF;
  
  -- Get plan details
  SELECT "trainerId", "clientId" 
  INTO plan_trainer_id, plan_client_id
  FROM public."WorkoutPlan" 
  WHERE id = plan_id;
  
  -- TRAINER can manage plans they created
  IF user_role = 'TRAINER' AND plan_trainer_id = current_user_id THEN
    RETURN true;
  END IF;
  
  -- CLIENT can view (not manage) plans assigned to them
  IF user_role = 'CLIENT' AND plan_client_id = current_user_id THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;
```

## Table-Specific RLS Policies

### 1. User Table

```sql
-- Enable RLS
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public."User"
  FOR SELECT 
  TO authenticated 
  USING (
    "authUserId" = auth.uid()::text 
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Trainers can view assigned clients
CREATE POLICY "Trainers can view assigned clients" ON public."User"
  FOR SELECT 
  TO authenticated 
  USING (
    get_user_role() = 'TRAINER' 
    AND id IN (
      SELECT "clientId" 
      FROM public."TrainerClient" 
      WHERE "trainerId" = get_current_user_id()
    )
  );

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public."User"
  FOR UPDATE 
  TO authenticated 
  USING (
    "authUserId" = auth.uid()::text 
    OR get_user_role() = 'ADMIN'
  )
  WITH CHECK (
    "authUserId" = auth.uid()::text 
    OR get_user_role() = 'ADMIN'
  );

-- Policy: New users can insert their profile
CREATE POLICY "Users can create own profile" ON public."User"
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    "authUserId" = auth.uid()::text 
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Only admins can delete users
CREATE POLICY "Only admins can delete users" ON public."User"
  FOR DELETE 
  TO authenticated 
  USING (get_user_role() = 'ADMIN');
```

### 2. TrainerClient Table

```sql
-- Enable RLS
ALTER TABLE public."TrainerClient" ENABLE ROW LEVEL SECURITY;

-- Policy: Trainers can view their client relationships
CREATE POLICY "Trainers can view their client relationships" ON public."TrainerClient"
  FOR SELECT 
  TO authenticated 
  USING (
    "trainerId" = get_current_user_id()
    OR "clientId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Only trainers and admins can create client relationships
CREATE POLICY "Trainers can create client relationships" ON public."TrainerClient"
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    (get_user_role() = 'TRAINER' AND "trainerId" = get_current_user_id())
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Only trainers and admins can remove client relationships
CREATE POLICY "Trainers can remove client relationships" ON public."TrainerClient"
  FOR DELETE 
  TO authenticated 
  USING (
    (get_user_role() = 'TRAINER' AND "trainerId" = get_current_user_id())
    OR get_user_role() = 'ADMIN'
  );

-- Policy: No updates allowed (use delete/insert instead)
CREATE POLICY "No updates on trainer client relationships" ON public."TrainerClient"
  FOR UPDATE 
  TO authenticated 
  USING (false);
```

### 3. WorkoutPlan Table

```sql
-- Enable RLS
ALTER TABLE public."WorkoutPlan" ENABLE ROW LEVEL SECURITY;

-- Policy: Trainers can view plans they created
CREATE POLICY "Trainers can view own plans" ON public."WorkoutPlan"
  FOR SELECT 
  TO authenticated 
  USING (
    (get_user_role() = 'TRAINER' AND "trainerId" = get_current_user_id())
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Clients can view plans assigned to them
CREATE POLICY "Clients can view assigned plans" ON public."WorkoutPlan"
  FOR SELECT 
  TO authenticated 
  USING (
    (get_user_role() = 'CLIENT' AND "clientId" = get_current_user_id())
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Only trainers can create workout plans
CREATE POLICY "Trainers can create workout plans" ON public."WorkoutPlan"
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    (get_user_role() = 'TRAINER' 
     AND "trainerId" = get_current_user_id()
     AND is_trainer_for_client("clientId"))
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Trainers can update their own plans
CREATE POLICY "Trainers can update own plans" ON public."WorkoutPlan"
  FOR UPDATE 
  TO authenticated 
  USING (
    (get_user_role() = 'TRAINER' AND "trainerId" = get_current_user_id())
    OR get_user_role() = 'ADMIN'
  )
  WITH CHECK (
    (get_user_role() = 'TRAINER' AND "trainerId" = get_current_user_id())
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Trainers can delete their own plans
CREATE POLICY "Trainers can delete own plans" ON public."WorkoutPlan"
  FOR DELETE 
  TO authenticated 
  USING (
    (get_user_role() = 'TRAINER' AND "trainerId" = get_current_user_id())
    OR get_user_role() = 'ADMIN'
  );
```

### 4. WorkoutDay Table

```sql
-- Enable RLS
ALTER TABLE public."WorkoutDay" ENABLE ROW LEVEL SECURITY;

-- Policy: Access based on parent WorkoutPlan access
CREATE POLICY "Workout day access follows plan access" ON public."WorkoutDay"
  FOR ALL 
  TO authenticated 
  USING (can_manage_workout_plan("planId"))
  WITH CHECK (can_manage_workout_plan("planId"));
```

### 5. WorkoutDayExercise Table

```sql
-- Enable RLS
ALTER TABLE public."WorkoutDayExercise" ENABLE ROW LEVEL SECURITY;

-- Policy: Access based on parent WorkoutDay access
CREATE POLICY "Workout day exercise access follows day access" ON public."WorkoutDayExercise"
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public."WorkoutDay" wd
      WHERE wd.id = "workoutDayId" 
      AND can_manage_workout_plan(wd."planId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."WorkoutDay" wd
      WHERE wd.id = "workoutDayId" 
      AND can_manage_workout_plan(wd."planId")
    )
  );
```

### 6. WorkoutSetInstruction Table

```sql
-- Enable RLS
ALTER TABLE public."WorkoutSetInstruction" ENABLE ROW LEVEL SECURITY;

-- Policy: Access based on parent WorkoutDayExercise access
CREATE POLICY "Set instruction access follows exercise access" ON public."WorkoutSetInstruction"
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public."WorkoutDayExercise" wde
      JOIN public."WorkoutDay" wd ON wd.id = wde."workoutDayId"
      WHERE wde.id = "exerciseId" 
      AND can_manage_workout_plan(wd."planId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."WorkoutDayExercise" wde
      JOIN public."WorkoutDay" wd ON wd.id = wde."workoutDayId"
      WHERE wde.id = "exerciseId" 
      AND can_manage_workout_plan(wd."planId")
    )
  );
```

### 7. ExerciseLog Table

```sql
-- Enable RLS
ALTER TABLE public."ExerciseLog" ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view and create their own exercise logs
CREATE POLICY "Clients can manage own exercise logs" ON public."ExerciseLog"
  FOR ALL 
  TO authenticated 
  USING (
    "clientId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  )
  WITH CHECK (
    ("clientId" = get_current_user_id() AND get_user_role() IN ('CLIENT', 'TRAINER'))
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Trainers can view their clients' exercise logs
CREATE POLICY "Trainers can view client exercise logs" ON public."ExerciseLog"
  FOR SELECT 
  TO authenticated 
  USING (
    get_user_role() = 'TRAINER' 
    AND is_trainer_for_client("clientId")
  );
```

### 8. ClientMaxLift Table

```sql
-- Enable RLS
ALTER TABLE public."ClientMaxLift" ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can manage their own max lifts
CREATE POLICY "Clients can manage own max lifts" ON public."ClientMaxLift"
  FOR ALL 
  TO authenticated 
  USING (
    "clientId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  )
  WITH CHECK (
    ("clientId" = get_current_user_id() AND get_user_role() IN ('CLIENT', 'TRAINER'))
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Trainers can view their clients' max lifts
CREATE POLICY "Trainers can view client max lifts" ON public."ClientMaxLift"
  FOR SELECT 
  TO authenticated 
  USING (
    get_user_role() = 'TRAINER' 
    AND is_trainer_for_client("clientId")
  );
```

### 9. SubscriptionPlan Table

```sql
-- Enable RLS
ALTER TABLE public."SubscriptionPlan" ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view subscription plans
CREATE POLICY "All users can view subscription plans" ON public."SubscriptionPlan"
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Policy: Only admins can manage subscription plans
CREATE POLICY "Only admins can manage subscription plans" ON public."SubscriptionPlan"
  FOR ALL 
  TO authenticated 
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');
```

### 10. UserSubscription Table

```sql
-- Enable RLS
ALTER TABLE public."UserSubscription" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public."UserSubscription"
  FOR SELECT 
  TO authenticated 
  USING (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Users can create their own subscriptions
CREATE POLICY "Users can create own subscriptions" ON public."UserSubscription"
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Users and admins can update subscriptions
CREATE POLICY "Users can update own subscriptions" ON public."UserSubscription"
  FOR UPDATE 
  TO authenticated 
  USING (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  )
  WITH CHECK (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Only admins can delete subscriptions
CREATE POLICY "Only admins can delete subscriptions" ON public."UserSubscription"
  FOR DELETE 
  TO authenticated 
  USING (get_user_role() = 'ADMIN');
```

### 11. SubscriptionEvent Table

```sql
-- Enable RLS
ALTER TABLE public."SubscriptionEvent" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription events
CREATE POLICY "Users can view own subscription events" ON public."SubscriptionEvent"
  FOR SELECT 
  TO authenticated 
  USING (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  );

-- Policy: System and admins can create subscription events
CREATE POLICY "System can create subscription events" ON public."SubscriptionEvent"
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    get_user_role() = 'ADMIN'
    OR "userId" = get_current_user_id()
  );

-- Policy: Only admins can update/delete subscription events
CREATE POLICY "Only admins can modify subscription events" ON public."SubscriptionEvent"
  FOR UPDATE 
  TO authenticated 
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');

CREATE POLICY "Only admins can delete subscription events" ON public."SubscriptionEvent"
  FOR DELETE 
  TO authenticated 
  USING (get_user_role() = 'ADMIN');
```

### 12. TransformationPhoto Table

```sql
-- Enable RLS
ALTER TABLE public."TransformationPhoto" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own photos
CREATE POLICY "Users can view own photos" ON public."TransformationPhoto"
  FOR SELECT 
  TO authenticated 
  USING (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Trainers can view their clients' photos
CREATE POLICY "Trainers can view client photos" ON public."TransformationPhoto"
  FOR SELECT 
  TO authenticated 
  USING (
    get_user_role() = 'TRAINER' 
    AND is_trainer_for_client("userId")
  );

-- Policy: Users can view public photos
CREATE POLICY "Public photos are visible to all" ON public."TransformationPhoto"
  FOR SELECT 
  TO authenticated 
  USING ("privacySetting" = 'PUBLIC');

-- Policy: Users can manage their own photos
CREATE POLICY "Users can manage own photos" ON public."TransformationPhoto"
  FOR ALL 
  TO authenticated 
  USING (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  )
  WITH CHECK (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  );
```

### 13. WebhookEvent Table

```sql
-- Enable RLS
ALTER TABLE public."WebhookEvent" ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can access webhook events
CREATE POLICY "Only admins can access webhook events" ON public."WebhookEvent"
  FOR ALL 
  TO authenticated 
  USING (get_user_role() = 'ADMIN')
  WITH CHECK (get_user_role() = 'ADMIN');

-- Policy: Allow service role for webhook processing
CREATE POLICY "Service role can manage webhook events" ON public."WebhookEvent"
  FOR ALL 
  TO service_role 
  USING (true)
  WITH CHECK (true);
```

### 14. WorkoutExerciseList Table

```sql
-- Enable RLS
ALTER TABLE public."WorkoutExerciseList" ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view exercises
CREATE POLICY "All users can view exercises" ON public."WorkoutExerciseList"
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Policy: Trainers and admins can create exercises
CREATE POLICY "Trainers can create exercises" ON public."WorkoutExerciseList"
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    (get_user_role() IN ('TRAINER', 'ADMIN') AND "createdById" = get_current_user_id())
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Users can update exercises they created
CREATE POLICY "Users can update own exercises" ON public."WorkoutExerciseList"
  FOR UPDATE 
  TO authenticated 
  USING (
    "createdById" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  )
  WITH CHECK (
    "createdById" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Users can delete exercises they created
CREATE POLICY "Users can delete own exercises" ON public."WorkoutExerciseList"
  FOR DELETE 
  TO authenticated 
  USING (
    "createdById" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  );
```

### 15. WeightLog Table

```sql
-- Enable RLS
ALTER TABLE public."WeightLog" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own weight logs
CREATE POLICY "Users can manage own weight logs" ON public."WeightLog"
  FOR ALL 
  TO authenticated 
  USING (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  )
  WITH CHECK (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Trainers can view their clients' weight logs
CREATE POLICY "Trainers can view client weight logs" ON public."WeightLog"
  FOR SELECT 
  TO authenticated 
  USING (
    get_user_role() = 'TRAINER' 
    AND is_trainer_for_client("userId")
  );
```

### 16. CalculatorSession Table

```sql
-- Enable RLS
ALTER TABLE public."CalculatorSession" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own calculator sessions
CREATE POLICY "Users can manage own calculator sessions" ON public."CalculatorSession"
  FOR ALL 
  TO authenticated 
  USING (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  )
  WITH CHECK (
    "userId" = get_current_user_id()
    OR get_user_role() = 'ADMIN'
  );

-- Policy: Trainers can view their clients' calculator sessions
CREATE POLICY "Trainers can view client calculator sessions" ON public."CalculatorSession"
  FOR SELECT 
  TO authenticated 
  USING (
    get_user_role() = 'TRAINER' 
    AND is_trainer_for_client("userId")
  );
```

## Advanced RLS Scenarios

### Conditional Access Based on Subscription

```sql
-- Helper function to check if user has active subscription in specific category
CREATE OR REPLACE FUNCTION public.has_subscription_access(category text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  subscriptions jsonb;
BEGIN
  user_role := auth.jwt() ->> 'user_role';
  
  -- TRAINER and ADMIN have full access
  IF user_role IN ('TRAINER', 'ADMIN') THEN
    RETURN true;
  END IF;
  
  -- Check if CLIENT has active subscription in the category
  subscriptions := auth.jwt() -> 'subscriptions';
  RETURN subscriptions ? category AND subscriptions -> category ->> 'status' = 'ACTIVE';
END;
$$;

-- Helper function to check if user has any active subscription
CREATE OR REPLACE FUNCTION public.has_any_subscription_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  subscriptions jsonb;
BEGIN
  user_role := auth.jwt() ->> 'user_role';
  
  -- TRAINER and ADMIN have full access
  IF user_role IN ('TRAINER', 'ADMIN') THEN
    RETURN true;
  END IF;
  
  -- Check if CLIENT has any active subscription
  subscriptions := auth.jwt() -> 'subscriptions';
  RETURN (subscriptions ? 'FITNESS') OR (subscriptions ? 'PSYCHOLOGY') OR (subscriptions ? 'MANIFESTATION');
END;
$$;

-- Helper function for backwards compatibility (deprecated - use category-specific checks)
CREATE OR REPLACE FUNCTION public.has_premium_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN has_any_subscription_access();
END;
$$;

-- Example policy using subscription check
CREATE POLICY "Premium transformation photos access" ON public."TransformationPhoto"
  FOR SELECT 
  TO authenticated 
  USING (
    -- Own photos always visible
    "userId" = get_current_user_id()
    -- Public photos visible to users with any subscription
    OR ("privacySetting" = 'PUBLIC' AND has_any_subscription_access())
    -- Trainers can see client photos (they have platform access)
    OR (get_user_role() = 'TRAINER' AND is_trainer_for_client("userId"))
    -- Admin always has access
    OR get_user_role() = 'ADMIN'
  );
```

### Content Category Access Control

```sql
-- Example: Fitness content requires FITNESS subscription
CREATE POLICY "Fitness content requires subscription" ON public."WorkoutPlan"
  FOR SELECT 
  TO authenticated 
  USING (
    -- Trainers and admins have full access
    get_user_role() IN ('TRAINER', 'ADMIN')
    -- Clients need FITNESS subscription for their assigned plans
    OR (get_user_role() = 'CLIENT' 
        AND "clientId" = get_current_user_id() 
        AND has_subscription_access('FITNESS'))
  );

-- Example: Psychology content gate (if you have psychology-specific tables)
-- CREATE POLICY "Psychology content requires subscription" ON public."PsychologyContent"
--   FOR SELECT 
--   TO authenticated 
--   USING (
--     get_user_role() IN ('TRAINER', 'ADMIN')
--     OR (get_user_role() = 'CLIENT' AND has_subscription_access('PSYCHOLOGY'))
--   );

-- Example: Manifestation content gate (if you have manifestation-specific tables)
-- CREATE POLICY "Manifestation content requires subscription" ON public."ManifestationContent"
--   FOR SELECT 
--   TO authenticated 
--   USING (
--     get_user_role() IN ('TRAINER', 'ADMIN')
--     OR (get_user_role() = 'CLIENT' AND has_subscription_access('MANIFESTATION'))
--   );
```

### Time-Based Access Control

```sql
-- Example: Active subscription check (updated for new subscription model)
CREATE OR REPLACE FUNCTION public.has_active_subscription()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  has_active boolean := false;
BEGIN
  user_role := get_user_role();
  
  -- TRAINER and ADMIN always have platform access
  IF user_role IN ('TRAINER', 'ADMIN') THEN
    RETURN true;
  END IF;
  
  -- Check database for any active subscriptions
  SELECT EXISTS(
    SELECT 1 FROM public."UserSubscription" 
    WHERE "userId" = get_current_user_id()
    AND status = 'ACTIVE'
    AND ("endDate" IS NULL OR "endDate" > NOW())
  ) INTO has_active;
  
  RETURN has_active;
END;
$$;

-- Example: Check active subscription in specific category
CREATE OR REPLACE FUNCTION public.has_active_subscription_category(category text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  has_active boolean := false;
BEGIN
  user_role := get_user_role();
  
  -- TRAINER and ADMIN always have platform access
  IF user_role IN ('TRAINER', 'ADMIN') THEN
    RETURN true;
  END IF;
  
  -- Check database for active subscription in specific category
  SELECT EXISTS(
    SELECT 1 FROM public."UserSubscription" us
    JOIN public."SubscriptionPlan" sp ON us."planId" = sp.id
    WHERE us."userId" = get_current_user_id()
    AND us.status = 'ACTIVE'
    AND sp.category = category
    AND (us."endDate" IS NULL OR us."endDate" > NOW())
  ) INTO has_active;
  
  RETURN has_active;
END;
$$;
```

### Bulk Operations Security

```sql
-- Example: Prevent bulk data export
CREATE OR REPLACE FUNCTION public.prevent_bulk_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Limit large queries (this is a simplified example)
  -- In practice, you'd use query cost analysis
  RETURN get_user_role() = 'ADMIN';
END;
$$;
```

## Testing RLS Policies

### Test Scenarios

```sql
-- Test as CLIENT with FITNESS subscription
SET LOCAL "request.jwt.claims" = '{
  "sub": "test-user-auth-id",
  "user_role": "CLIENT", 
  "subscriptions": {"FITNESS": {"status": "ACTIVE", "plan_id": "123", "plan_name": "Basic Fitness"}},
  "user_internal_id": "user-123",
  "profile_completed": true
}';

-- Try to access data
SELECT * FROM public."WorkoutPlan"; -- Should only see assigned plans with FITNESS subscription

-- Test as CLIENT with multiple subscriptions
SET LOCAL "request.jwt.claims" = '{
  "sub": "test-user-auth-id",
  "user_role": "CLIENT", 
  "subscriptions": {
    "FITNESS": {"status": "ACTIVE", "plan_id": "123"},
    "PSYCHOLOGY": {"status": "ACTIVE", "plan_id": "456"}
  },
  "user_internal_id": "user-123",
  "profile_completed": true
}';

-- Test as CLIENT with no subscriptions
SET LOCAL "request.jwt.claims" = '{
  "sub": "test-user-auth-id",
  "user_role": "CLIENT", 
  "subscriptions": {},
  "user_internal_id": "user-123",
  "profile_completed": true
}';

-- Test as TRAINER
SET LOCAL "request.jwt.claims" = '{
  "sub": "trainer-auth-id",
  "user_role": "TRAINER",
  "subscriptions": {"platform_access": "full"},
  "user_internal_id": "trainer-123",
  "profile_completed": true
}';

-- Try to access data
SELECT * FROM public."ExerciseLog"; -- Should only see assigned clients' logs

-- Test as ADMIN role
SET LOCAL "request.jwt.claims" = '{
  "sub": "admin-auth-id",
  "user_role": "ADMIN",
  "subscriptions": {"platform_access": "full"},
  "user_internal_id": "admin-123",
  "profile_completed": true
}';
SELECT * FROM public."User"; -- Should see all users

-- Test subscription-specific access
SELECT has_subscription_access('FITNESS'); -- Should return based on current role and subscriptions
SELECT has_subscription_access('PSYCHOLOGY'); -- Test category-specific access
SELECT has_any_subscription_access(); -- Test any subscription access
```

### RLS Policy Verification

```sql
-- Check if RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- View all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test policy effectiveness
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public."WorkoutPlan" 
WHERE "clientId" = 'test-client-id';
```

## Performance Considerations

### Indexing for RLS

```sql
-- Indexes to support RLS policies
CREATE INDEX IF NOT EXISTS idx_user_auth_user_id ON public."User"("authUserId");
CREATE INDEX IF NOT EXISTS idx_trainer_client_trainer ON public."TrainerClient"("trainerId");
CREATE INDEX IF NOT EXISTS idx_trainer_client_client ON public."TrainerClient"("clientId");
CREATE INDEX IF NOT EXISTS idx_workout_plan_trainer ON public."WorkoutPlan"("trainerId");
CREATE INDEX IF NOT EXISTS idx_workout_plan_client ON public."WorkoutPlan"("clientId");
CREATE INDEX IF NOT EXISTS idx_exercise_log_client ON public."ExerciseLog"("clientId");
CREATE INDEX IF NOT EXISTS idx_weight_log_user ON public."WeightLog"("userId");
CREATE INDEX IF NOT EXISTS idx_user_subscription_user ON public."UserSubscription"("userId");

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_user_subscription_active 
ON public."UserSubscription"("userId", "status", "endDate");

-- Additional indexes for subscription category queries
CREATE INDEX IF NOT EXISTS idx_subscription_plan_category 
ON public."SubscriptionPlan"("category");

CREATE INDEX IF NOT EXISTS idx_user_subscription_plan_category 
ON public."UserSubscription"("userId", "planId") 
INCLUDE ("status", "endDate");
```

### Policy Optimization

```sql
-- Use EXISTS instead of JOIN when possible
-- Good:
EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = current_user_id)

-- Less optimal:
id IN (SELECT client_id FROM trainer_clients WHERE trainer_id = current_user_id)
```

## Subscription-Based Policy Examples

Here are practical examples of how to implement subscription-gated content access:

```sql
-- Example 1: Fitness workout plans require FITNESS subscription
ALTER POLICY "Clients can view assigned plans" ON public."WorkoutPlan"
  USING (
    (get_user_role() = 'CLIENT' 
     AND "clientId" = get_current_user_id() 
     AND has_subscription_access('FITNESS'))
    OR get_user_role() IN ('TRAINER', 'ADMIN')
  );

-- Example 2: Premium transformation photos for subscribers only
CREATE POLICY "Premium photos require subscription" ON public."TransformationPhoto"
  FOR SELECT 
  TO authenticated 
  USING (
    -- Own photos always visible
    "userId" = get_current_user_id()
    -- Premium photos visible to subscribers only
    OR ("privacySetting" = 'PREMIUM' AND has_any_subscription_access())
    -- Trainers can see client photos if they're assigned
    OR (get_user_role() = 'TRAINER' AND is_trainer_for_client("userId"))
    -- Admin always has access
    OR get_user_role() = 'ADMIN'
  );

-- Example 3: Calculator sessions based on subscription
CREATE POLICY "Advanced calculators require subscription" ON public."CalculatorSession"
  FOR ALL 
  TO authenticated 
  USING (
    -- Basic calculators available to all
    ("calculatorType" = 'BASIC')
    -- Advanced calculators require subscription
    OR ("calculatorType" IN ('FITNESS', 'PSYCHOLOGY', 'MANIFESTATION') 
        AND has_subscription_access("calculatorType"::text))
    -- Own sessions always accessible
    OR "userId" = get_current_user_id()
    -- Trainers can see client sessions
    OR (get_user_role() = 'TRAINER' AND is_trainer_for_client("userId"))
    -- Admin access
    OR get_user_role() = 'ADMIN'
  )
  WITH CHECK (
    -- Can create basic sessions without subscription
    ("calculatorType" = 'BASIC' AND "userId" = get_current_user_id())
    -- Advanced sessions require subscription
    OR ("calculatorType" IN ('FITNESS', 'PSYCHOLOGY', 'MANIFESTATION') 
        AND "userId" = get_current_user_id()
        AND has_subscription_access("calculatorType"::text))
    -- Admin can create any
    OR get_user_role() = 'ADMIN'
  );
```

## Webhook Integration Notes

These RLS policies work seamlessly with Razorpay webhooks:

1. **Webhook updates subscription status** → `UserSubscription.status` changes to 'EXPIRED'/'CANCELLED'
2. **Auth hook runs on next login** → JWT updated with new subscription data
3. **RLS policies automatically enforce** → Content access updated in real-time

**No additional RLS changes needed for webhook integration!**

## Security Audit Checklist

- [ ] All tables have RLS enabled
- [ ] No policies allow unrestricted access with `USING (true)` unless intended
- [ ] Policies properly check user roles and relationships
- [ ] Helper functions use `SECURITY DEFINER` appropriately
- [ ] Subscription checks use both JWT and database validation
- [ ] Indexes support RLS policy performance
- [ ] Test scenarios cover all role and subscription combinations
- [ ] No information leakage through error messages
- [ ] Bulk export prevention measures in place
- [ ] Webhook integration properly updates subscription access

## Troubleshooting Common Issues

### Policy Not Working
1. Check if RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'YourTable';`
2. Verify JWT claims are correct: `SELECT auth.jwt();`
3. Test helper functions independently
4. Check policy order (more restrictive first)

### Performance Issues
1. Add indexes for columns used in RLS policies
2. Use `EXPLAIN ANALYZE` to identify slow queries
3. Avoid complex JOINs in policy conditions
4. Consider materialized views for complex access patterns

### Access Denied Errors
1. Verify user has correct role in JWT
2. Check if user exists in User table with correct authUserId
3. Verify trainer-client relationships exist
4. Test policies with manual role setting

This comprehensive RLS implementation provides secure, scalable access control for your fitness training application while maintaining good performance and flexibility.
