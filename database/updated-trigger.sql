-- Drop existing function and trigger to avoid conflicts
DROP FUNCTION IF EXISTS public.create_user_record CASCADE;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow trigger to insert user" ON public.users_profile;

-- Create updated function that handles role from metadata
CREATE OR REPLACE FUNCTION public.create_user_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role public."Role";
BEGIN
  -- Check if email_confirmed_at was updated to non-NULL
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    
    -- Extract role from raw_user_meta_data, default to CLIENT
    user_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public."Role", 
      'CLIENT'::public."Role"
    );
    
    -- Insert into public.users_profile
    INSERT INTO public.users_profile (
      id,
      email,
      name,
      role,
      profile_completed
    )
    VALUES (
      NEW.id::uuid, -- UUID as substitute for cuid
      NEW.email,
      COALESCE(
        (NEW.raw_user_meta_data->>'name')::text, 
        SPLIT_PART(NEW.email, '@', 1)
      ),
      user_role,
      CASE 
        WHEN user_role = 'CLIENT' THEN false 
        ELSE true  -- Trainers start with profile completed
      END
    )
    ON CONFLICT (email) DO NOTHING;
    
    -- Log the user creation for debugging
    RAISE NOTICE 'Created user profile: email=%, role=%, name=%', 
      NEW.email, 
      user_role, 
      COALESCE((NEW.raw_user_meta_data->>'name')::text, SPLIT_PART(NEW.email, '@', 1));
      
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant permissions for the function
GRANT EXECUTE ON FUNCTION public.create_user_record TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.create_user_record FROM authenticated, anon, public;

-- Grant table permissions
GRANT INSERT ON public.users_profile TO postgres, supabase_auth_admin;

-- Set function owner
ALTER FUNCTION public.create_user_record OWNER TO postgres;

-- Create trigger with error handling
DO $$
BEGIN
  -- Drop existing trigger if it exists
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'create_user_email_confirmation_trigger'
  ) THEN
    DROP TRIGGER create_user_email_confirmation_trigger ON auth.users;
  END IF;

  -- Create new trigger
  CREATE TRIGGER create_user_email_confirmation_trigger
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_record();
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Permission denied for auth schema. Please contact Supabase support to grant USAGE on auth to postgres or use an Edge Function.';
END;
$$;

-- Ensure RLS is enabled on User table
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow trigger to insert user" ON public.users_profile
AS PERMISSIVE FOR INSERT
TO postgres, supabase_auth_admin
WITH CHECK (true);

-- Test the function (optional - you can remove this)
-- SELECT public.create_user_record();
