-- Test permissions for supabase_auth_admin role
-- Run these queries to check if the role can access the tables

-- 1. Check if supabase_auth_admin role exists
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles 
WHERE rolname = 'supabase_auth_admin';

-- 2. Check if the role has access to the schema
SELECT 
  nspname as schema_name,
  has_schema_privilege('supabase_auth_admin', nspname, 'USAGE') as has_usage
FROM pg_namespace 
WHERE nspname = 'public';

-- 3. Check if the role has access to the tables
SELECT 
  schemaname,
  tablename,
  has_table_privilege('supabase_auth_admin', schemaname||'.'||tablename, 'SELECT') as has_select
FROM pg_tables 
WHERE tablename IN ('users_profile', 'user_subscriptions', 'subscription_plans')
AND schemaname = 'public';

-- 4. Check RLS policies on users_profile
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users_profile' 
AND schemaname = 'public';

-- 5. Test direct access as supabase_auth_admin (if possible)
-- This might not work in the SQL editor, but worth trying
SELECT 
  id,
  email,
  role,
  profile_completed
FROM public.users_profile 
LIMIT 3;
