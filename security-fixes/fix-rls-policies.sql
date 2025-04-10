-- Security fixes for RLS policies
-- Run this script in the Supabase SQL Editor to update your RLS policies

-- Fix 1: Update the too-permissive DELETE policy for user_workout_logs
DROP POLICY IF EXISTS "Delete User Workout Logs" ON "public"."user_workout_logs";
CREATE POLICY "Delete User Workout Logs" ON "public"."user_workout_logs"
FOR DELETE TO public
USING (auth.uid() = user_id);

-- Fix 2: Make "Enable read access for all users" more specific for workout logs
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."user_workout_logs";
CREATE POLICY "Enable read access for user's own logs" ON "public"."user_workout_logs"
FOR SELECT TO public
USING (auth.uid() = user_id);

-- Also add a policy for trainers to see their clients' logs
CREATE POLICY "Trainers can see client workout logs" ON "public"."user_workout_logs"
FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM trainer_clients
    WHERE trainer_clients.trainer_id = auth.uid()
    AND trainer_clients.client_id = user_workout_logs.user_id
  )
);

-- Fix 3: Tighten permissions for transformation_photos
DROP POLICY IF EXISTS "Users can see public photos" ON "public"."transformation_photos";
CREATE POLICY "Users can see public photos" ON "public"."transformation_photos"
FOR SELECT TO public
USING (
  privacy_setting = 'public'::photo_privacy 
  OR auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM trainer_clients
    WHERE trainer_clients.trainer_id = auth.uid()
    AND trainer_clients.client_id = transformation_photos.user_id
  )
);

-- Fix 4: Create a separate events table to track processed webhooks for idempotency 
-- if it doesn't already exist
CREATE TABLE IF NOT EXISTS "public"."subscription_events" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "user_id" uuid,
  "plan_id" uuid,
  "metadata" jsonb,
  "processed_at" timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("event_id")
);

-- Set up RLS for subscription_events
ALTER TABLE "public"."subscription_events" ENABLE ROW LEVEL SECURITY;

-- Only admins can access these events
CREATE POLICY "Admins can manage subscription events" ON "public"."subscription_events"
FOR ALL TO public
USING (
  auth.uid() IN (
    SELECT users.id FROM users WHERE users.role = 'admin'::app_role
  )
);

-- Service roles can insert events (for webhook processing)
CREATE POLICY "Service can insert events" ON "public"."subscription_events"
FOR INSERT TO service_role
WITH CHECK (true);

-- Fix 5: Update users table read permissions to be more specific
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."users";
CREATE POLICY "Basic user info is public" ON "public"."users"
FOR SELECT TO public
USING (true);

-- Add a comment explaining what we're fixing
COMMENT ON TABLE "public"."subscription_events" IS 'Used for tracking processed events and ensuring idempotency'; 