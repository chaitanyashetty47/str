import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { UserRole } from '@/types/auth';

/**
 * Validates user authentication and role on the server side using database queries
 * @param allowedRoles - Array of roles that can access this route
 * @returns Object containing user data and role
 */
export async function validateServerRole(allowedRoles: UserRole[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Query database for user role (source of truth)
  const { data: userData, error } = await supabase
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !userData) {
    redirect("/sign-in");
  }

  const userRole = userData.role as UserRole;

  if (!allowedRoles.includes(userRole)) {
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