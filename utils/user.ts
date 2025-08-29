import { createClient } from "@/utils/supabase/server";
import prisma from "@/utils/prisma/prismaClient";

export async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Check if the authenticated user has admin access
 * Returns user ID and role if admin, throws error otherwise
 */
export async function checkAdminAccess(): Promise<{ userId: string; role: string }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Authentication required");
  }

  // Get user profile to check role
  const userProfile = await prisma.users_profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!userProfile) {
    throw new Error("User profile not found");
  }

  // Check if user has admin access
  if (userProfile.role !== 'ADMIN' && userProfile.role !== 'FITNESS_TRAINER_ADMIN') {
    throw new Error("Admin access required");
  }

  return { userId: user.id, role: userProfile.role };
}

/**
 * Check if the authenticated user is an admin (boolean check)
 * Returns true if admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  try {
    await checkAdminAccess();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get admin user data if authenticated user is admin
 * Returns null if not admin (doesn't throw error)
 */
export async function getAdminUser(): Promise<{ userId: string; role: string } | null> {
  try {
    return await checkAdminAccess();
  } catch {
    return null;
  }
}

/**
 * Require admin access - throws error if not admin
 * Similar to checkAdminAccess but with more descriptive name
 */
export async function requireAdminAccess(): Promise<{ userId: string; role: string }> {
  return checkAdminAccess();
}

/**
 * Check if user has a specific role
 * Returns true if user has the role, false otherwise
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  try {
    const { role } = await checkAdminAccess();
    return role === requiredRole;
  } catch {
    return false;
  }
}

/**
 * Check if the authenticated user has fitness trainer access
 * Returns user ID and role if fitness trainer, throws error otherwise
 */
export async function checkTrainerAccess(): Promise<{ userId: string; role: string }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Authentication required");
  }

  // Get user profile to check role
  const userProfile = await prisma.users_profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!userProfile) {
    throw new Error("User profile not found");
  }

  // Check if user has fitness trainer access
  if (userProfile.role !== 'FITNESS_TRAINER' && userProfile.role !== 'FITNESS_TRAINER_ADMIN') {
    throw new Error("Fitness trainer access required");
  }

  return { userId: user.id, role: userProfile.role };
}

/**
 * Check if the authenticated user is a fitness trainer (boolean check)
 * Returns true if fitness trainer, false otherwise
 */
export async function isTrainer(): Promise<boolean> {
  try {
    await checkTrainerAccess();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get fitness trainer user data if authenticated user is a trainer
 * Returns null if not a trainer (doesn't throw error)
 */
export async function getTrainerUser(): Promise<{ userId: string; role: string } | null> {
  try {
    return await checkTrainerAccess();
  } catch {
    return null;
  }
}

/**
 * Require fitness trainer access - throws error if not a trainer
 * Similar to checkTrainerAccess but with more descriptive name
 */
export async function requireTrainerAccess(): Promise<{ userId: string; role: string }> {
  return checkTrainerAccess();
}

/**
 * Get user profile with role information
 * Returns user profile or null if not found
 */
export async function getUserProfile(): Promise<{ id: string; role: string; name?: string; email?: string } | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const userProfile = await prisma.users_profile.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true, email: true }
  });

  return userProfile;
}