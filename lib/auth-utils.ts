import {jwtDecode} from 'jwt-decode';
import type { 
  CustomClaims, 
  UserRole, 
  SubscriptionCategory, 
  UserSubscriptions, 
  TrainerCategory,
  PlatformAccess 
} from '@/types/auth';
import { ROLE_PERMISSIONS } from '@/types/auth';

export function decodeJWT(accessToken: string): CustomClaims | null {
  try {
    const decoded = jwtDecode<any>(accessToken);
    return {
      user_role: decoded.user_role || 'CLIENT',
      subscriptions: decoded.subscriptions || undefined,
      platform_access: decoded.platform_access || undefined,
      profile_completed: decoded.profile_completed || false,
      auth_user_id: decoded.auth_user_id || '',
    };
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}


// Helper functions for subscription checks (CLIENT only)
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

// Helper functions for trainer/admin platform access
export function getTrainerCategory(userRole: UserRole): TrainerCategory | undefined {
  switch (userRole) {
    case 'FITNESS_TRAINER':
    case 'FITNESS_TRAINER_ADMIN':
    case 'TRAINER': // Legacy
      return 'FITNESS';
    case 'PSYCHOLOGY_TRAINER':
      return 'PSYCHOLOGY';
    case 'MANIFESTATION_TRAINER':
      return 'MANIFESTATION';
    default:
      return undefined;
  }
}

export function hasAdminAccess(userRole: UserRole): boolean {
  return userRole === 'ADMIN' || userRole === 'FITNESS_TRAINER_ADMIN';
}

export function hasFitnessTrainerAccess(userRole: UserRole): boolean {
  return userRole === 'FITNESS_TRAINER' || userRole === 'FITNESS_TRAINER_ADMIN' || userRole === 'TRAINER';
}

export function hasPsychologyTrainerAccess(userRole: UserRole): boolean {
  return userRole === 'PSYCHOLOGY_TRAINER';
}

export function hasManifestationTrainerAccess(userRole: UserRole): boolean {
  return userRole === 'MANIFESTATION_TRAINER';
}

export function isTrainerRole(userRole: UserRole): boolean {
  return [
    'TRAINER',
    'FITNESS_TRAINER', 
    'PSYCHOLOGY_TRAINER', 
    'MANIFESTATION_TRAINER',
    'FITNESS_TRAINER_ADMIN'
  ].includes(userRole);
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
  // Define route access rules with new role structure
  const routeRules = {
    // CLIENT-ONLY routes
    '/calculator': ['CLIENT'],
    '/plans': ['CLIENT'], 
    '/transformation': ['CLIENT'],
    '/settings': ['CLIENT'],
    '/pricing': ['CLIENT'],
    '/personal-records': ['CLIENT'],
    '/workout-plan': ['CLIENT'],
    '/dashboard': ['CLIENT'],
    
    // TRAINER-ONLY routes
    '/fitness': ['FITNESS_TRAINER', 'FITNESS_TRAINER_ADMIN', 'TRAINER'], // Legacy TRAINER maps to fitness
    '/psychological': ['PSYCHOLOGY_TRAINER'],
    '/manifestation': ['MANIFESTATION_TRAINER'],
    
    // ADMIN-ONLY routes
    '/admin': ['ADMIN', 'FITNESS_TRAINER_ADMIN'],
    
    // SHARED routes - accessible by all authenticated users
    '/protected': ['CLIENT', 'FITNESS_TRAINER', 'PSYCHOLOGY_TRAINER', 'MANIFESTATION_TRAINER', 'FITNESS_TRAINER_ADMIN', 'ADMIN'],
    
    // Legacy /training route - redirect to /fitness
    '/training': ['FITNESS_TRAINER', 'FITNESS_TRAINER_ADMIN', 'TRAINER'],
  };

  for (const [route, allowedRoles] of Object.entries(routeRules)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(userRole);
    }
  }

  return true; // Allow access to public routes
}

// Helper function to get the appropriate redirect route based on role
export function getDefaultRouteForRole(userRole: UserRole): string {
  switch (userRole) {
    case 'FITNESS_TRAINER':
    case 'TRAINER': // Legacy
      return '/fitness';
    case 'PSYCHOLOGY_TRAINER':
      return '/psychological';
    case 'MANIFESTATION_TRAINER':
      return '/manifestation';
    case 'FITNESS_TRAINER_ADMIN':
      return '/fitness'; // Default to fitness, can switch to admin
    case 'ADMIN':
      return '/admin';
    case 'CLIENT':
    default:
      return '/dashboard';
  }
}

// Helper function to determine if user should see role switcher
export function shouldShowRoleSwitcher(userRole: UserRole): boolean {
  return userRole === 'FITNESS_TRAINER_ADMIN';
}

// Helper function to get available routes for role switcher
export function getAvailableRoutesForRole(userRole: UserRole): Array<{label: string, href: string, description: string}> {
  if (userRole === 'FITNESS_TRAINER_ADMIN') {
    return [
      {
        label: 'Fitness Trainer',
        href: '/fitness/clients',
        description: 'Manage fitness clients and workouts'
      },
      {
        label: 'Admin Panel', 
        href: '/admin',
        description: 'System administration'
      }
    ];
  }
  return [];
}