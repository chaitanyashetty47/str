-- Minimal debug version to identify the exact issue
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
  auth_user_id uuid;
  debug_info jsonb;
BEGIN
  -- Initialize debug info
  debug_info := '{}'::jsonb;
  
  -- Step 1: Check if function is being called
  debug_info := jsonb_set(debug_info, '{function_called}', to_jsonb(true));
  
  -- Initialize claims from event
  claims := COALESCE(event->'claims', '{}'::jsonb);
  debug_info := jsonb_set(debug_info, '{step1_claims_initialized}', to_jsonb(true));
  
  -- Step 2: Extract user_id
  BEGIN
    auth_user_id := (event->>'user_id')::uuid;
    debug_info := jsonb_set(debug_info, '{step2_user_id}', to_jsonb(auth_user_id::text));
  EXCEPTION WHEN OTHERS THEN
    debug_info := jsonb_set(debug_info, '{step2_error}', to_jsonb(SQLERRM));
    RETURN jsonb_set(event, '{claims}', jsonb_set(claims, '{debug_info}', debug_info));
  END;
  
  -- Step 3: Check if user_id is null
  IF auth_user_id IS NULL THEN
    debug_info := jsonb_set(debug_info, '{step3_null_user_id}', to_jsonb(true));
    RETURN jsonb_set(event, '{claims}', jsonb_set(claims, '{debug_info}', debug_info));
  END IF;
  
  debug_info := jsonb_set(debug_info, '{step3_user_id_valid}', to_jsonb(true));
  
  -- Step 4: Try to fetch user data
  BEGIN
    SELECT 
      role::text,
      profile_completed
    INTO user_role, user_profile_completed
    FROM public.users_profile 
    WHERE id = auth_user_id;
    
    debug_info := jsonb_set(debug_info, '{step4_user_role}', to_jsonb(user_role));
    debug_info := jsonb_set(debug_info, '{step4_profile_completed}', to_jsonb(user_profile_completed));
  EXCEPTION WHEN OTHERS THEN
    debug_info := jsonb_set(debug_info, '{step4_error}', to_jsonb(SQLERRM));
    user_role := 'CLIENT';
    user_profile_completed := false;
  END;
  
  -- Step 5: Set basic claims
  claims := jsonb_set(claims, '{auth_user_id}', to_jsonb(auth_user_id::text));
  debug_info := jsonb_set(debug_info, '{step5_auth_user_id_set}', to_jsonb(true));
  
  -- Step 6: Set user role
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    debug_info := jsonb_set(debug_info, '{step6_user_role_set}', to_jsonb(true));
    
    -- Step 7: Handle role-specific claims
    CASE user_role
      WHEN 'CLIENT' THEN
        debug_info := jsonb_set(debug_info, '{step7_case}', to_jsonb('CLIENT'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(COALESCE(user_profile_completed, false)));
        claims := jsonb_set(claims, '{subscriptions}', '{}'::jsonb);
        
      WHEN 'ADMIN' THEN
        debug_info := jsonb_set(debug_info, '{step7_case}', to_jsonb('ADMIN'));
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('admin'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      WHEN 'FITNESS_TRAINER' THEN
        debug_info := jsonb_set(debug_info, '{step7_case}', to_jsonb('FITNESS_TRAINER'));
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('fitness_trainer'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(true));
        
      ELSE
        debug_info := jsonb_set(debug_info, '{step7_case}', to_jsonb('ELSE'));
        debug_info := jsonb_set(debug_info, '{step7_unknown_role}', to_jsonb(user_role));
        claims := jsonb_set(claims, '{user_role}', to_jsonb('CLIENT'));
        claims := jsonb_set(claims, '{platform_access}', to_jsonb('none'));
        claims := jsonb_set(claims, '{profile_completed}', to_jsonb(COALESCE(user_profile_completed, false)));
        claims := jsonb_set(claims, '{subscriptions}', '{}'::jsonb);
    END CASE;
    
  ELSE
    debug_info := jsonb_set(debug_info, '{step6_user_role_null}', to_jsonb(true));
    claims := jsonb_set(claims, '{user_role}', to_jsonb('CLIENT'));
    claims := jsonb_set(claims, '{subscriptions}', '{}'::jsonb);
    claims := jsonb_set(claims, '{profile_completed}', to_jsonb(false));
  END IF;
  
  -- Add debug info to claims
  claims := jsonb_set(claims, '{debug_info}', debug_info);
  
  -- Return the modified event with updated claims
  RETURN jsonb_set(event, '{claims}', claims);
  
EXCEPTION WHEN OTHERS THEN
  -- If anything fails, return event with error info
  RETURN jsonb_set(event, '{claims}', jsonb_build_object(
    'debug_info', jsonb_build_object(
      'outer_exception', SQLERRM,
      'function_failed', true
    )
  ));
END;
$$;
