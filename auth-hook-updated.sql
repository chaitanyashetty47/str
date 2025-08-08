-- Drop existing auth hook function
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- Drop policies for auth admin access
DROP POLICY IF EXISTS "Allow auth admin to read user data" ON public.users_profile;
DROP POLICY IF EXISTS "Allow auth admin to read user subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Allow auth admin to read subscription plans" ON public.subscription_plans;

-- Create the updated custom access token hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_profile_completed boolean;
  user_subscriptions jsonb;
  auth_user_id uuid;
BEGIN
  -- Get the authUserId from the event and cast to UUID
  auth_user_id := (event->>'user_id')::uuid;

  -- Fetch user data from the User table
  SELECT 
    role::text,
    profile_completed
  INTO user_role, user_profile_completed
  FROM public.users_profile 
  WHERE id = auth_user_id;

  -- Get existing claims from the event
  claims := event->'claims';

  -- Add debug claim for user_role
  claims := jsonb_set(claims, '{debug_user_role}', to_jsonb(user_role::text));

  -- Add custom claims
  IF user_role IS NOT NULL THEN
    -- Set basic user claims
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role::text));
    claims := jsonb_set(claims, '{auth_user_id}', to_jsonb(auth_user_id::text));

    -- Handle subscriptions/platform access based on role
    CASE TRIM(UPPER(user_role))
      WHEN 'CLIENT' THEN
        -- For CLIENTS, fetch active subscriptions by category
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(user_profile_completed::boolean));
        SELECT jsonb_object_agg(
          sp.category::text,
          jsonb_build_object(
            'plan_id', sp.id::text,
            'plan_name', sp.name::text,
            'plan_type', sp."plan_type"::text,
            'status', us.status::text,
            'start_date', us."start_date"::text,
            'end_date', us."end_date"::text,
            'razorpay_subscription_id', us."razorpay_subscription_id"::text
          )
        )
        INTO user_subscriptions
        FROM public.user_subscriptions us 
        JOIN public.subscription_plans sp ON us."plan_id" = sp.id 
        WHERE us."user_id" = auth_user_id
        AND us.status = 'ACTIVE'
        AND us.payment_status = 'COMPLETED';
        claims := jsonb_set(claims, '{subscriptions}', COALESCE(user_subscriptions, '{}'::jsonb));

      WHEN 'FITNESS_TRAINER' THEN
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('fitness_trainer'::text));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true::boolean));

      WHEN 'PSYCHOLOGY_TRAINER' THEN
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('psychology_trainer'::text));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true::boolean));

      WHEN 'MANIFESTATION_TRAINER' THEN
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('manifestation_trainer'::text));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true::boolean));

      WHEN 'FITNESS_TRAINER_ADMIN' THEN
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('fitness_trainer_admin'::text));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true::boolean));

      WHEN 'ADMIN' THEN
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('admin'::text));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true::boolean));

      WHEN 'TRAINER' THEN
        -- Legacy TRAINER role - map to fitness_trainer for backward compatibility
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('fitness_trainer'::text));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true::boolean));

      ELSE
        -- Unknown role - treat as client with no subscriptions
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('none'::text));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(user_profile_completed::boolean));
        claims := jsonb_set(claims, '{subscriptions}', '{}'::jsonb);
    END CASE;

  ELSE
    -- Default claims for new users (no profile found)
    claims := jsonb_set(claims, '{user_role}', to_jsonb('CLIENT'::text));
    claims := jsonb_set(claims, '{subscriptions}', '{}'::jsonb);
    claims := jsonb_set(claims, '{profile_completed}', to_jsonb(false::boolean));
    claims := jsonb_set(claims, '{auth_user_id}', to_jsonb(auth_user_id::text));
  END IF;

  -- Return the modified event with updated claims
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant necessary permissions for the auth hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- Grant read access to necessary tables for auth admin
GRANT SELECT ON public.users_profile TO supabase_auth_admin;
GRANT SELECT ON public.user_subscriptions TO supabase_auth_admin;
GRANT SELECT ON public.subscription_plans TO supabase_auth_admin;

-- Create policies for auth admin to read user data
CREATE POLICY "Allow auth admin to read user data" ON public.users_profile
AS PERMISSIVE FOR SELECT
TO supabase_auth_admin
USING (true);

CREATE POLICY "Allow auth admin to read user subscriptions" ON public.user_subscriptions
AS PERMISSIVE FOR SELECT
TO supabase_auth_admin
USING (true);

CREATE POLICY "Allow auth admin to read subscription plans" ON public.subscription_plans
AS PERMISSIVE FOR SELECT
TO supabase_auth_admin
USING (true);