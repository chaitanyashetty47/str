-- Drop existing auth hook function
DROP FUNCTION IF EXISTS public.custom_access_token_hook(jsonb);

-- Drop policies for auth admin access
DROP POLICY IF EXISTS "Allow auth admin to read user data" ON public.users_profile;
DROP POLICY IF EXISTS "Allow auth admin to read user subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Allow auth admin to read subscription plans" ON public.subscription_plans;

-- Create the fixed custom access token hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Required for auth hooks to access user data
STABLE
SET search_path = '' -- Security best practice
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_profile_completed boolean;
  user_subscriptions jsonb;
  auth_user_id uuid;
BEGIN
  -- Initialize claims from event
  claims := COALESCE(event->'claims', '{}'::jsonb);
  
  -- Safely extract and validate user_id
  BEGIN
    auth_user_id := (event->>'user_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- If user_id is invalid, return event unchanged
    RETURN event;
  END;
  
  -- Return early if no user_id
  IF auth_user_id IS NULL THEN
    RETURN event;
  END IF;

  -- Fetch user data with error handling
  BEGIN
    SELECT 
      role::text,
      profile_completed
    INTO user_role, user_profile_completed
    FROM public.users_profile 
    WHERE id = auth_user_id;
  EXCEPTION WHEN OTHERS THEN
    -- If query fails, set default values
    user_role := 'CLIENT';
    user_profile_completed := false;
  END;
  
  -- Set basic user claims
  claims := jsonb_set(claims, '{auth_user_id}', to_jsonb(auth_user_id::text));
  
  -- Handle role-based claims
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    
    -- Handle subscriptions/platform access based on role
    CASE user_role
      WHEN 'CLIENT' THEN
        -- For CLIENTS, set profile completion and fetch subscriptions
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(COALESCE(user_profile_completed, false)));
        
        -- Safely fetch subscriptions with error handling
        BEGIN
          SELECT jsonb_object_agg(
            sp.category::text,
            jsonb_build_object(
              'plan_id', sp.id::text,
              'plan_name', sp.name,
              'plan_type', sp.plan_type::text,
              'status', us.status::text,
              'start_date', us.start_date::text,
              'end_date', us.end_date::text,
              'razorpay_subscription_id', us.razorpay_subscription_id
            )
          )
          INTO user_subscriptions
          FROM public.user_subscriptions us 
          JOIN public.subscription_plans sp ON us.plan_id = sp.id 
          WHERE us.user_id = auth_user_id
          AND us.status = 'ACTIVE'
          AND us.payment_status = 'COMPLETED';
          
          claims := jsonb_set(claims, '{subscriptions}', COALESCE(user_subscriptions, '{}'::jsonb));
        EXCEPTION WHEN OTHERS THEN
          -- If subscription query fails, set empty subscriptions
          claims := jsonb_set(claims, '{subscriptions}', '{}'::jsonb);
        END;
        
      WHEN 'FITNESS_TRAINER' THEN
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('fitness_trainer'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      WHEN 'PSYCHOLOGY_TRAINER' THEN
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('psychology_trainer'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      WHEN 'MANIFESTATION_TRAINER' THEN
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('manifestation_trainer'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      WHEN 'FITNESS_TRAINER_ADMIN' THEN
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('fitness_trainer_admin'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      WHEN 'ADMIN' THEN
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('admin'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      WHEN 'TRAINER' THEN
        -- Legacy TRAINER role - map to fitness_trainer
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('fitness_trainer'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      ELSE
        -- Unknown role - treat as client
        claims := jsonb_set(claims, '{user_role}', to_jsonb('CLIENT'));
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('none'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(COALESCE(user_profile_completed, false)));
        claims := jsonb_set(claims, '{subscriptions}', '{}'::jsonb);
    END CASE;
    
  ELSE
    -- No user profile found - set default CLIENT claims
    claims := jsonb_set(claims, '{user_role}', to_jsonb('CLIENT'));
    claims := jsonb_set(claims, '{subscriptions}', '{}'::jsonb);
    claims := jsonb_set(claims, '{profile_completed}', to_jsonb(false));
  END IF;

  -- Return the modified event with updated claims
  RETURN jsonb_set(event, '{claims}', claims);
  
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, return the original event to prevent auth failure
  RETURN event;
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
