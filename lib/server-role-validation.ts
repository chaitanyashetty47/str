import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { UserRole } from '@/types/auth';
import { decodeJWT } from './auth-utils';

/**
 * Validates user authentication and role on the server side using database queries
 * @param allowedRoles - Array of roles that can access this route
 * @returns Object containing user data and role
 */
export async function validateServerRole(allowedRoles: UserRole[]) {
  const supabase = await createClient();
  
  // First, get the user from auth
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (!user || userError) {
    // console.error("Auth error in validateServerRole:", userError);
    redirect("/sign-in");
  }

  // console.log("validateServerRole: User ID:", user.id);

  // Try to get session to check JWT claims as well
  const { data: { session } } = await supabase.auth.getSession();
  // console.log("validateServerRole: Session exists:", !!session);

  // Query database for user role (source of truth)
  const { data: userData, error } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  // console.log("validateServerRole: Database query result:", { userData, error });

  if (error) {
    // console.error("Database error in validateServerRole:", error);
    
    // If database query fails, try to get role from JWT as fallback
    if (session?.access_token) {
      try {
        const claims = decodeJWT(session.access_token);
        const userRole = claims?.user_role as UserRole;
        
        if (userRole && allowedRoles.includes(userRole)) {
          // console.log("validateServerRole: Using JWT fallback, role:", userRole);
          return { user, userRole };
        }
      } catch (jwtError) {
        // console.error("JWT decode error:", jwtError);
      }
    }
    
    redirect("/sign-in");
  }

  if (!userData) {
    // console.error("No user profile found for user:", user.id);
    redirect("/sign-in");
  }

  const userRole = userData.role as UserRole;
  // console.log("validateServerRole: User role from DB:", userRole);

  if (!allowedRoles.includes(userRole)) {
    // console.error("User role not allowed:", userRole, "Allowed:", allowedRoles);
    redirect("/unauthorized");
  }

  return { user, userRole };
}

/**
 * Validates user authentication only (no role check)
 * @returns Object containing user data
 */
export async function validateServerAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return { user };
}