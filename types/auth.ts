export type UserRole = 
  | 'CLIENT' 
  | 'TRAINER' // Legacy - will be removed
  | 'FITNESS_TRAINER'
  | 'PSYCHOLOGY_TRAINER' 
  | 'MANIFESTATION_TRAINER'
  | 'FITNESS_TRAINER_ADMIN'
  | 'ADMIN';

export type TrainerCategory = 'FITNESS' | 'PSYCHOLOGY' | 'MANIFESTATION';
export type PlatformAccess = 
  | 'fitness_trainer'
  | 'psychology_trainer'
  | 'manifestation_trainer'
  | 'fitness_trainer_admin'
  | 'admin'
  | 'none';

export type SubscriptionCategory = 'FITNESS' | 'PSYCHOLOGY' | 'MANIFESTATION' | 'ALL_IN_ONE';
export type PlanType = 'ONLINE' | 'IN_PERSON' | 'SELF_PACED';

export interface UserSubscription {
  plan_id: string;
  plan_name: string;
  plan_type: PlanType;
  status: string;
  start_date: string;
  end_date: string | null;
  razorpay_subscription_id?: string;
}

export interface UserSubscriptions {
  FITNESS?: UserSubscription;
  PSYCHOLOGY?: UserSubscription;
  MANIFESTATION?: UserSubscription;
  ALL_IN_ONE?: UserSubscription;
}

export interface CustomClaims {
  user_role: UserRole;
  subscriptions?: UserSubscriptions; // Only for CLIENT
  platform_access?: PlatformAccess; // Only for TRAINER/ADMIN roles
  profile_completed: boolean;
  auth_user_id: string; // Matches public.User.id
}

export interface AuthUser {
  id: string; // Supabase auth ID and User ID
  email: string;
  role: UserRole;
  subscriptions?: UserSubscriptions; // Only for CLIENT
  platformAccess?: PlatformAccess; // Only for TRAINER/ADMIN roles
  profileCompleted: boolean;
  trainerCategory?: TrainerCategory; // Derived from role
}

export interface RolePermissions {
  CLIENT: string[];
  TRAINER: string[]; // Legacy
  FITNESS_TRAINER: string[];
  PSYCHOLOGY_TRAINER: string[];
  MANIFESTATION_TRAINER: string[];
  FITNESS_TRAINER_ADMIN: string[];
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
  
  // Fitness trainer specific
  FITNESS_CLIENTS_MANAGE: 'fitness.clients.manage',
  FITNESS_PLANS_CREATE: 'fitness.plans.create',
  FITNESS_PROGRESS_VIEW: 'fitness.progress.view',
  
  // Psychology trainer specific
  PSYCHOLOGY_CLIENTS_MANAGE: 'psychology.clients.manage',
  PSYCHOLOGY_SESSIONS_CREATE: 'psychology.sessions.create',
  PSYCHOLOGY_ASSESSMENTS_VIEW: 'psychology.assessments.view',
  
  // Manifestation trainer specific
  MANIFESTATION_CLIENTS_MANAGE: 'manifestation.clients.manage',
  MANIFESTATION_GOALS_CREATE: 'manifestation.goals.create',
  MANIFESTATION_TRACKING_VIEW: 'manifestation.tracking.view',
  
  // Admin permissions
  ADMIN_USER_MANAGEMENT: 'admin.user_management',
  ADMIN_SYSTEM_CONFIG: 'admin.system_config',
  ADMIN_VIEW_ALL: 'admin.view_all',
} as const;

const CLIENT_PERMISSIONS = [
  PERMISSIONS.WORKOUTS_LOG,
  PERMISSIONS.WORKOUTS_VIEW_OWN,
  PERMISSIONS.PLANS_VIEW_OWN,
  PERMISSIONS.PROFILE_VIEW_OWN,
  PERMISSIONS.PROFILE_EDIT_OWN,
];

const FITNESS_TRAINER_PERMISSIONS = [
  ...CLIENT_PERMISSIONS,
  PERMISSIONS.FITNESS_CLIENTS_MANAGE,
  PERMISSIONS.FITNESS_PLANS_CREATE,
  PERMISSIONS.FITNESS_PROGRESS_VIEW,
  PERMISSIONS.PLANS_CREATE,
  PERMISSIONS.PLANS_ASSIGN,
  PERMISSIONS.PLANS_VIEW_CREATED,
  PERMISSIONS.CLIENTS_MANAGE,
  PERMISSIONS.CLIENTS_VIEW_PROGRESS,
  PERMISSIONS.WORKOUTS_VIEW_CLIENTS,
];

const PSYCHOLOGY_TRAINER_PERMISSIONS = [
  ...CLIENT_PERMISSIONS,
  PERMISSIONS.PSYCHOLOGY_CLIENTS_MANAGE,
  PERMISSIONS.PSYCHOLOGY_SESSIONS_CREATE,
  PERMISSIONS.PSYCHOLOGY_ASSESSMENTS_VIEW,
  PERMISSIONS.CLIENTS_MANAGE,
  PERMISSIONS.CLIENTS_VIEW_PROGRESS,
];

const MANIFESTATION_TRAINER_PERMISSIONS = [
  ...CLIENT_PERMISSIONS,
  PERMISSIONS.MANIFESTATION_CLIENTS_MANAGE,
  PERMISSIONS.MANIFESTATION_GOALS_CREATE,
  PERMISSIONS.MANIFESTATION_TRACKING_VIEW,
  PERMISSIONS.CLIENTS_MANAGE,
  PERMISSIONS.CLIENTS_VIEW_PROGRESS,
];

export const ROLE_PERMISSIONS: RolePermissions = {
  CLIENT: CLIENT_PERMISSIONS,
  TRAINER: FITNESS_TRAINER_PERMISSIONS, // Legacy - map to fitness trainer
  FITNESS_TRAINER: FITNESS_TRAINER_PERMISSIONS,
  PSYCHOLOGY_TRAINER: PSYCHOLOGY_TRAINER_PERMISSIONS,
  MANIFESTATION_TRAINER: MANIFESTATION_TRAINER_PERMISSIONS,
  FITNESS_TRAINER_ADMIN: [
    ...FITNESS_TRAINER_PERMISSIONS,
    ...Object.values(PERMISSIONS).filter(p => p.startsWith('admin.')),
  ],
  ADMIN: Object.values(PERMISSIONS),
};