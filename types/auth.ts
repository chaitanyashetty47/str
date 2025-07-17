export type UserRole = 'CLIENT' | 'TRAINER' | 'ADMIN';
export type SubscriptionCategory = 'FITNESS' | 'PSYCHOLOGY' | 'MANIFESTATION' | 'ALL_IN_ONE';
export type PlanType = 'ONLINE' | 'IN_PERSON' | 'SELF_PACED';


export interface UserSubscription {
  plan_id: string;
  plan_name: string;
  plan_type: PlanType;
  status: string;
  start_date: string;
  end_date: string | null;
}

export interface UserSubscriptions {
  FITNESS?: UserSubscription;
  PSYCHOLOGY?: UserSubscription;
  MANIFESTATION?: UserSubscription;
  ALL_IN_ONE?: UserSubscription;
  platform_access?: 'full'; // For TRAINER/ADMIN
}

export interface CustomClaims {
  user_role: UserRole;
  subscriptions: UserSubscriptions;
  profile_completed: boolean;
  // user_internal_id: string;
  auth_user_id: string; // Matches public.User.id
}

export interface AuthUser {
  id: string; // Supabase auth ID and User ID
  email: string;
  role: UserRole;
  subscriptions: UserSubscriptions;
  profileCompleted: boolean;
  //internalId: string; // Your User table ID
}

export interface RolePermissions {
  CLIENT: string[];
  TRAINER: string[];
  ADMIN: string[];
}

// Permission constants
export const PERMISSIONS = {
  // Workout permissions
  WORKOUTS_LOG: 'workouts.log',
  WORKOUTS_VIEW_OWN: 'workouts.view_own',
  WORKOUTS_VIEW_CLIENTS: 'workouts.view_clients',
  
  // Plan permissions
  PLANS_CREATE: 'plans.create',
  PLANS_ASSIGN: 'plans.assign',
  PLANS_VIEW_OWN: 'plans.view_own',
  PLANS_VIEW_CREATED: 'plans.view_created',
  
  // Client management
  CLIENTS_MANAGE: 'clients.manage',
  CLIENTS_VIEW_PROGRESS: 'clients.view_progress',
  
  // Profile permissions
  PROFILE_VIEW_OWN: 'profile.view_own',
  PROFILE_EDIT_OWN: 'profile.edit_own',
  
  // Admin permissions
  ADMIN_USER_MANAGEMENT: 'admin.user_management',
  ADMIN_SYSTEM_CONFIG: 'admin.system_config',
  ADMIN_VIEW_ALL: 'admin.view_all',
} as const;

export const ROLE_PERMISSIONS: RolePermissions = {
  CLIENT: [
    PERMISSIONS.WORKOUTS_LOG,
    PERMISSIONS.WORKOUTS_VIEW_OWN,
    PERMISSIONS.PLANS_VIEW_OWN,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
  ],
  TRAINER: [
    // All CLIENT permissions
    PERMISSIONS.WORKOUTS_LOG,
    PERMISSIONS.WORKOUTS_VIEW_OWN,
    PERMISSIONS.PLANS_VIEW_OWN,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    // Plus trainer-specific
    PERMISSIONS.PLANS_CREATE,
    PERMISSIONS.PLANS_ASSIGN,
    PERMISSIONS.PLANS_VIEW_CREATED,
    PERMISSIONS.CLIENTS_MANAGE,
    PERMISSIONS.CLIENTS_VIEW_PROGRESS,
    PERMISSIONS.WORKOUTS_VIEW_CLIENTS,
  ],
  ADMIN: [
    // All permissions
    ...Object.values(PERMISSIONS),
  ],
};