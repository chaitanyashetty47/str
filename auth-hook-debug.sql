-- Debug version of auth hook to identify the issue
-- This will help us see exactly where the problem occurs

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_profile_completed boolean;
  user_subscriptions jsonb;
  auth_user_id uuid;
  debug_info jsonb;
BEGIN
  -- Initialize debug info
  debug_info := '{}'::jsonb;
  
  -- Initialize claims from event
  claims := COALESCE(event->'claims', '{}'::jsonb);
  
  -- Safely extract and validate user_id
  BEGIN
    auth_user_id := (event->>'user_id')::uuid;
    debug_info := jsonb_set(debug_info, '{step1_user_id}', to_jsonb(auth_user_id::text));
  EXCEPTION WHEN OTHERS THEN
    debug_info := jsonb_set(debug_info, '{step1_error}', to_jsonb(SQLERRM));
    RETURN event;
  END;
  
  -- Return early if no user_id
  IF auth_user_id IS NULL THEN
    debug_info := jsonb_set(debug_info, '{step2_null_user_id}', to_jsonb(true));
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
    
    debug_info := jsonb_set(debug_info, '{step3_user_role}', to_jsonb(user_role));
    debug_info := jsonb_set(debug_info, '{step3_profile_completed}', to_jsonb(user_profile_completed));
  EXCEPTION WHEN OTHERS THEN
    debug_info := jsonb_set(debug_info, '{step3_error}', to_jsonb(SQLERRM));
    user_role := 'CLIENT';
    user_profile_completed := false;
  END;
  
  -- Set basic user claims
  claims := jsonb_set(claims, '{auth_user_id}', to_jsonb(auth_user_id::text));
  debug_info := jsonb_set(debug_info, '{step4_auth_user_id_set}', to_jsonb(true));
  
  -- Handle role-based claims
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    debug_info := jsonb_set(debug_info, '{step5_user_role_set}', to_jsonb(true));
    
    -- Handle subscriptions/platform access based on role
    CASE user_role
      WHEN 'CLIENT' THEN
        debug_info := jsonb_set(debug_info, '{step6_case}', to_jsonb('CLIENT'));
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
          debug_info := jsonb_set(debug_info, '{step6_subscriptions_fetched}', to_jsonb(true));
        EXCEPTION WHEN OTHERS THEN
          debug_info := jsonb_set(debug_info, '{step6_subscription_error}', to_jsonb(SQLERRM));
          claims := jsonb_set(claims, '{subscriptions}', '{}'::jsonb);
        END;
        
      WHEN 'FITNESS_TRAINER' THEN
        debug_info := jsonb_set(debug_info, '{step6_case}', to_jsonb('FITNESS_TRAINER'));
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('fitness_trainer'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        debug_info := jsonb_set(debug_info, '{step6_fitness_trainer_complete}', to_jsonb(true));
        
      WHEN 'PSYCHOLOGY_TRAINER' THEN
        debug_info := jsonb_set(debug_info, '{step6_case}', to_jsonb('PSYCHOLOGY_TRAINER'));
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('psychology_trainer'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      WHEN 'MANIFESTATION_TRAINER' THEN
        debug_info := jsonb_set(debug_info, '{step6_case}', to_jsonb('MANIFESTATION_TRAINER'));
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('manifestation_trainer'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      WHEN 'FITNESS_TRAINER_ADMIN' THEN
        debug_info := jsonb_set(debug_info, '{step6_case}', to_jsonb('FITNESS_TRAINER_ADMIN'));
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('fitness_trainer_admin'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      WHEN 'ADMIN' THEN
        debug_info := jsonb_set(debug_info, '{step6_case}', to_jsonb('ADMIN'));
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('admin'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        debug_info := jsonb_set(debug_info, '{step6_admin_complete}', to_jsonb(true));
        
      WHEN 'TRAINER' THEN
        debug_info := jsonb_set(debug_info, '{step6_case}', to_jsonb('TRAINER'));
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('fitness_trainer'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      ELSE
        debug_info := jsonb_set(debug_info, '{step6_case}', to_jsonb('ELSE'));
        debug_info := jsonb_set(debug_info, '{step6_unknown_role}', to_jsonb(user_role));
        claims := jsonb_set(claims, '{user_role}', to_jsonb('CLIENT'));
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('none'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(COALESCE(user_profile_completed, false)));
        claims := jsonb_set(claims, '{subscriptions}', '{}'::jsonb);
    END CASE;
    
  ELSE
    debug_info := jsonb_set(debug_info, '{step5_user_role_null}', to_jsonb(true));
    -- No user profile found - set default CLIENT claims
    claims := jsonb_set(claims, '{user_role}', to_jsonb('CLIENT'));
    claims := jsonb_set(claims, '{subscriptions}', '{}'::jsonb);
    claims := jsonb_set(claims, '{profile_completed}', to_jsonb(false));
  END IF;

  -- Add debug info to claims
  claims := jsonb_set(claims, '{debug_info}', debug_info);
  
  -- Return the modified event with updated claims
  RETURN jsonb_set(event, '{claims}', claims);
  
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, return the original event to prevent auth failure
  RETURN event;
END;
$$;
