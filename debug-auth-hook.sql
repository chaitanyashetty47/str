-- Debug script to test auth hook function
-- Run this in Supabase SQL Editor to test the auth hook

-- 1. First, let's check what users exist in the database
SELECT 
  id,
  email,
  role,
  profile_completed,
  created_at
FROM public.users_profile 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Check if there are any users with trainer roles
SELECT 
  id,
  email,
  role,
  profile_completed
FROM public.users_profile 
WHERE role IN ('FITNESS_TRAINER', 'PSYCHOLOGY_TRAINER', 'MANIFESTATION_TRAINER', 'FITNESS_TRAINER_ADMIN', 'ADMIN', 'TRAINER')
ORDER BY created_at DESC;

-- 3. Test the auth hook function with a sample event
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from step 1
SELECT public.custom_access_token_hook(
  '{
    "user_id": "YOUR_USER_ID_HERE",
    "claims": {}
  }'::jsonb
) as hook_result;

-- 4. Test with a CLIENT user
-- Replace 'CLIENT_USER_ID_HERE' with a CLIENT user ID
SELECT public.custom_access_token_hook(
  '{
    "user_id": "CLIENT_USER_ID_HERE", 
    "claims": {}
  }'::jsonb
) as client_hook_result;

-- 5. Test with a TRAINER user  
-- Replace 'TRAINER_USER_ID_HERE' with a TRAINER user ID
SELECT public.custom_access_token_hook(
  '{
    "user_id": "TRAINER_USER_ID_HERE",
    "claims": {}
  }'::jsonb
) as trainer_hook_result;

-- 6. Check if there's a mismatch between auth.users and users_profile
-- This query helps identify if users exist in auth but not in users_profile
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  up.id as profile_id,
  up.email as profile_email,
  up.role as profile_role
FROM auth.users au
LEFT JOIN public.users_profile up ON au.id = up.id
WHERE au.email IS NOT NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- 7. Check for any users that exist in auth but not in users_profile
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users_profile up ON au.id = up.id
WHERE up.id IS NULL
  AND au.email IS NOT NULL
ORDER BY au.created_at DESC;

-- 8. Check for any users that exist in users_profile but not in auth
SELECT 
  up.id,
  up.email,
  up.role,
  up.created_at
FROM public.users_profile up
LEFT JOIN auth.users au ON up.id = au.id
WHERE au.id IS NULL
ORDER BY up.created_at DESC;
