import {jwtDecode} from 'jwt-decode';
import type { CustomClaims, UserRole, SubscriptionCategory, UserSubscriptions} from '@/types/auth';
import { ROLE_PERMISSIONS } from '@/types/auth';

export function decodeJWT(accessToken: string): CustomClaims | null {
  try {
    const decoded = jwtDecode<any>(accessToken);
    return {
      user_role: decoded.user_role || 'CLIENT',
      subscriptions: decoded.subscriptions || {},
      profile_completed: decoded.profile_completed || false,
      auth_user_id: decoded.auth_user_id || '',
    };
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}


// Helper functions for subscription checks
export function hasActiveSubscription(
  subscriptions: UserSubscriptions, 
  category: SubscriptionCategory
): boolean {
  if (category === 'ALL_IN_ONE') return !!subscriptions.ALL_IN_ONE;

  if (subscriptions.ALL_IN_ONE) return true; // bundle covers all

  return !!subscriptions[category as keyof UserSubscriptions];
}

export function hasAnyActiveSubscription(subscriptions: UserSubscriptions): boolean {
  return !!(
    subscriptions.FITNESS ||
    subscriptions.PSYCHOLOGY ||
    subscriptions.MANIFESTATION ||
    subscriptions.ALL_IN_ONE
  );
}

export function hasPlatformAccess(subscriptions: UserSubscriptions): boolean {
  return subscriptions.platform_access === 'full';
}

export function getActiveSubscriptionCategories(subscriptions: UserSubscriptions): SubscriptionCategory[] {
  const categories: SubscriptionCategory[] = [];
  if (subscriptions.ALL_IN_ONE) {
    // All-in-one grants access to all individual categories
    categories.push('FITNESS', 'PSYCHOLOGY', 'MANIFESTATION');
    return Array.from(new Set(categories));
  }

  if (subscriptions.FITNESS) categories.push('FITNESS');
  if (subscriptions.PSYCHOLOGY) categories.push('PSYCHOLOGY');
  if (subscriptions.MANIFESTATION) categories.push('MANIFESTATION');
  return categories;
}

export function hasPermission(
  userRole: UserRole, 
  permission: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(
  userRole: UserRole, 
  permissions: string[]
): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(
  userRole: UserRole, 
  permissions: string[]
): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

export function canAccessRoute(
  userRole: UserRole, 
  pathname: string
): boolean {
  // Define route access rules
  const routeRules = {
    '/training': ['TRAINER', 'ADMIN'],
    '/admin': ['ADMIN'],
    '/profile': ['CLIENT', 'TRAINER', 'ADMIN'],
    '/workouts': ['CLIENT', 'TRAINER', 'ADMIN'],
    '/subscriptions': ['CLIENT', 'TRAINER', 'ADMIN'],
  };

  for (const [route, allowedRoles] of Object.entries(routeRules)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(userRole);
    }
  }

  return true; // Allow access to public routes
}