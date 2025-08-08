-- Simple test script to debug auth hook issues
-- Run these queries one by one in Supabase SQL Editor

-- Step 1: Check if the auth hook function exists and is working
SELECT 
  routine_name,
  routine_type,
  data_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'custom_access_token_hook'
AND routine_schema = 'public';

-- Step 2: Test the auth hook with a simple event
SELECT public.custom_access_token_hook(
  '{
    "user_id": "test-user-id",
    "claims": {}
  }'::jsonb
) as test_result;

-- Step 3: Check what users exist in users_profile
SELECT 
  id,
  email,
  role,
  profile_completed
FROM public.users_profile 
LIMIT 5;

-- Step 4: Test with an actual user ID (replace with a real user ID from step 3)
-- Replace 'ACTUAL_USER_ID' with a real user ID from the previous query
SELECT public.custom_access_token_hook(
  '{
    "user_id": "ACTUAL_USER_ID",
    "claims": {}
  }'::jsonb
) as real_user_test;

-- Step 5: Check if the user exists in both auth.users and users_profile
-- Replace 'ACTUAL_USER_ID' with the same user ID from step 4
SELECT 
  'auth.users' as table_name,
  id,
  email,
  created_at
FROM auth.users 
WHERE id = 'ACTUAL_USER_ID'

UNION ALL

SELECT 
  'users_profile' as table_name,
  id,
  email,
  created_at
FROM public.users_profile 
WHERE id = 'ACTUAL_USER_ID';

-- Step 6: Test the auth hook with a user that definitely exists
-- This will help us see if the issue is with user lookup or the hook logic
SELECT 
  up.id,
  up.email,
  up.role,
  up.profile_completed,
  public.custom_access_token_hook(
    jsonb_build_object(
      'user_id', up.id,
      'claims', '{}'::jsonb
    )
  ) as hook_result
FROM public.users_profile up
LIMIT 3;
