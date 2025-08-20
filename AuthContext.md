# Comprehensive Role-Based Authentication Architecture Guide

## Overview

This guide demonstrates a complete, scalable role-based authentication system built with Next.js, Supabase, and TypeScript. The architecture provides granular permission control, role-based access control (RBAC), and a clean separation of concerns that can be easily adapted to other projects.

## Architecture Components

### 1. Type Definitions (`types/auth.ts`)
### 2. Utility Functions (`lib/auth-utils.ts`)
### 3. Authentication Context (`contexts/AuthContext.tsx`)
### 4. Permission System
### 5. Route Protection

---

## 1. Type Definitions (`types/auth.ts`)

### Core Types

```typescript
// User roles - define all possible roles in your system
export type UserRole = 
  | 'CLIENT' 
  | 'TRAINER' // Legacy - will be removed
  | 'FITNESS_TRAINER'
  | 'PSYCHOLOGY_TRAINER' 
  | 'MANIFESTATION_TRAINER'
  | 'FITNESS_TRAINER_ADMIN'
  | 'ADMIN';

// Categories for trainers (useful for UI organization)
export type TrainerCategory = 'FITNESS' | 'PSYCHOLOGY' | 'MANIFESTATION';

// Platform access levels
export type PlatformAccess = 
  | 'fitness_trainer'
  | 'psychology_trainer'
  | 'manifestation_trainer'
  | 'fitness_trainer_admin'
  | 'admin'
  | 'none';

// Subscription categories (for client access control)
export type SubscriptionCategory = 'FITNESS' | 'PSYCHOLOGY' | 'MANIFESTATION' | 'ALL_IN_ONE';
export type PlanType = 'ONLINE' | 'IN_PERSON' | 'SELF_PACED';
```

### Data Structures

```typescript
// Individual subscription details
export interface UserSubscription {
  plan_id: string;
  plan_name: string;
  plan_type: PlanType;
  status: string;
  start_date: string;
  end_date: string | null;
  razorpay_subscription_id?: string;
}

// User's subscription portfolio
export interface UserSubscriptions {
  FITNESS?: UserSubscription;
  PSYCHOLOGY?: UserSubscription;
  MANIFESTATION?: UserSubscription;
  ALL_IN_ONE?: UserSubscription;
}

// JWT claims structure
export interface CustomClaims {
  user_role: UserRole;
  subscriptions?: UserSubscriptions; // Only for CLIENT
  platform_access?: PlatformAccess; // Only for TRAINER/ADMIN roles
  profile_completed: boolean;
  auth_user_id: string; // Matches public.User.id
}

// Main user object used throughout the app
export interface AuthUser {
  id: string; // Supabase auth ID and User ID
  email: string;
  role: UserRole;
  subscriptions?: UserSubscriptions; // Only for CLIENT
  platformAccess?: PlatformAccess; // Only for TRAINER/ADMIN roles
  profileCompleted: boolean;
  trainerCategory?: TrainerCategory; // Derived from role
}
```

### Permission System

```typescript
// Permission constants - define granular permissions
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
  
  // Role-specific permissions
  FITNESS_CLIENTS_MANAGE: 'fitness.clients.manage',
  PSYCHOLOGY_CLIENTS_MANAGE: 'psychology.clients.manage',
  MANIFESTATION_CLIENTS_MANAGE: 'manifestation.clients.manage',
  
  // Admin permissions
  ADMIN_USER_MANAGEMENT: 'admin.user_management',
  ADMIN_SYSTEM_CONFIG: 'admin.system_config',
  ADMIN_VIEW_ALL: 'admin.view_all',
} as const;

// Role-permission mapping
export const ROLE_PERMISSIONS: RolePermissions = {
  CLIENT: [
    PERMISSIONS.WORKOUTS_LOG,
    PERMISSIONS.WORKOUTS_VIEW_OWN,
    PERMISSIONS.PLANS_VIEW_OWN,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
  ],
  FITNESS_TRAINER: [
    // Inherit client permissions
    ...CLIENT_PERMISSIONS,
    // Add trainer-specific permissions
    PERMISSIONS.FITNESS_CLIENTS_MANAGE,
    PERMISSIONS.PLANS_CREATE,
    PERMISSIONS.CLIENTS_MANAGE,
  ],
  ADMIN: Object.values(PERMISSIONS), // All permissions
};
```

---

## 2. Utility Functions (`lib/auth-utils.ts`)

### JWT Decoding

```typescript
import {jwtDecode} from 'jwt-decode';

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
```

### Permission Checking

```typescript
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
```

### Role-Based Helpers

```typescript
export function getTrainerCategory(userRole: UserRole): TrainerCategory | undefined {
  switch (userRole) {
    case 'FITNESS_TRAINER':
    case 'FITNESS_TRAINER_ADMIN':
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

export function isTrainerRole(userRole: UserRole): boolean {
  return [
    'TRAINER',
    'FITNESS_TRAINER', 
    'PSYCHOLOGY_TRAINER', 
    'MANIFESTATION_TRAINER',
    'FITNESS_TRAINER_ADMIN'
  ].includes(userRole);
}
```

### Route Access Control

```typescript
export function canAccessRoute(
  userRole: UserRole, 
  pathname: string
): boolean {
  const routeRules = {
    '/fitness': ['FITNESS_TRAINER', 'FITNESS_TRAINER_ADMIN'],
    '/psychological': ['PSYCHOLOGY_TRAINER'],
    '/admin': ['ADMIN', 'FITNESS_TRAINER_ADMIN'],
    '/profile': ['CLIENT', 'FITNESS_TRAINER', 'PSYCHOLOGY_TRAINER', 'ADMIN'],
  };

  for (const [route, allowedRoles] of Object.entries(routeRules)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(userRole);
    }
  }

  return true; // Allow access to public routes
}
```

---

## 3. Authentication Context (`contexts/AuthContext.tsx`)

### Context Setup

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { decodeJWT } from '@/lib/auth-utils';
import type { AuthUser } from '@/types/auth';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isClient: boolean;
  isTrainer: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

### Provider Implementation

```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Decode JWT and set auth user when session changes
  useEffect(() => {
    if (session?.access_token && user) {
      const claims = decodeJWT(session.access_token);
      
      if (claims) {
        setAuthUser({
          id: user.id,
          email: user.email!,
          role: claims.user_role,
          subscriptions: claims.subscriptions,
          platformAccess: claims.platform_access,
          profileCompleted: claims.profile_completed,
          trainerCategory: getTrainerCategory(claims.user_role),
        });
      }
    } else {
      setAuthUser(null);
    }
  }, [session, user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: authUser,
        supabaseUser: user,
        session,
        loading,
        isAuthenticated: !!authUser,
        isClient: authUser?.role === 'CLIENT',
        isTrainer: authUser ? isTrainerRole(authUser.role) : false,
        isAdmin: authUser?.role === 'ADMIN',
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

### Hook Usage

```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

---

## 4. Permission System Implementation

### Direct Permission Checks

```typescript
import { hasPermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  
  const canManageClients = hasPermission(user?.role, PERMISSIONS.CLIENTS_MANAGE);
  const canCreatePlans = hasPermission(user?.role, PERMISSIONS.PLANS_CREATE);
  
  return (
    <div>
      {canManageClients && <ClientManagementPanel />}
      {canCreatePlans && <CreatePlanButton />}
    </div>
  );
}
```

### Permission-Based Rendering

```typescript
function ConditionalComponent() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Check multiple permissions
  const canManageFitness = hasPermission(user.role, PERMISSIONS.FITNESS_CLIENTS_MANAGE);
  const canViewProgress = hasPermission(user.role, PERMISSIONS.CLIENTS_VIEW_PROGRESS);
  
  if (canManageFitness && canViewProgress) {
    return <FullClientDashboard />;
  } else if (canViewProgress) {
    return <ReadOnlyClientDashboard />;
  }
  
  return <AccessDenied />;
}
```

---

## 5. Route Protection

### Middleware Implementation

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { canAccessRoute } from '@/lib/auth-utils';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Check route access based on user role
    const userRole = user.user_metadata?.user_role || 'CLIENT';
    const canAccess = canAccessRoute(userRole, request.nextUrl.pathname);
    
    if (!canAccess) {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
```

### Component-Level Route Protection

```typescript
// components/auth/ProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requiredPermissions, 
  redirectTo = '/unauthorized' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push(redirectTo);
      return;
    }

    if (requiredPermissions) {
      const hasAllRequired = requiredPermissions.every(permission => 
        hasPermission(user.role, permission)
      );
      
      if (!hasAllRequired) {
        router.push(redirectTo);
        return;
      }
    }
  }, [user, loading, allowedRoles, requiredPermissions, router, redirectTo]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return <>{children}</>;
}
```

---

## 6. Implementation Steps for New Projects

### Step 1: Define Your Role Structure

```typescript
// types/auth.ts
export type UserRole = 
  | 'USER'
  | 'MODERATOR'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export type Permission = 
  | 'users.read'
  | 'users.write'
  | 'content.moderate'
  | 'system.admin';
```

### Step 2: Create Permission Mappings

```typescript
export const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
  CONTENT_MODERATE: 'content.moderate',
  SYSTEM_ADMIN: 'system.admin',
} as const;

export const ROLE_PERMISSIONS = {
  USER: [PERMISSIONS.USERS_READ],
  MODERATOR: [PERMISSIONS.USERS_READ, PERMISSIONS.CONTENT_MODERATE],
  ADMIN: [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_WRITE, PERMISSIONS.CONTENT_MODERATE],
  SUPER_ADMIN: Object.values(PERMISSIONS),
};
```

### Step 3: Implement Utility Functions

```typescript
// lib/auth-utils.ts
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

export function canAccessRoute(userRole: UserRole, pathname: string): boolean {
  const routeRules = {
    '/admin': ['ADMIN', 'SUPER_ADMIN'],
    '/moderate': ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'],
  };

  for (const [route, allowedRoles] of Object.entries(routeRules)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(userRole);
    }
  }

  return true;
}
```

### Step 4: Create Authentication Context

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  signOut: () => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Implementation similar to the example above
  // but adapted to your role structure
}
```

### Step 5: Set Up Route Protection

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // Implementation similar to the example above
  // but using your role and permission structure
}
```

---

## 7. Best Practices

### 1. **Separation of Concerns**
- Keep types, utilities, and context separate
- Don't mix business logic with authentication logic

### 2. **Type Safety**
- Use TypeScript for all authentication-related code
- Define strict types for roles and permissions
- Avoid magic strings

### 3. **Performance**
- Use React Context sparingly
- Implement proper loading states
- Cache permission checks when possible

### 4. **Security**
- Always validate permissions on the server side
- Use middleware for route protection
- Implement proper JWT validation

### 5. **Scalability**
- Design permission system to handle new roles easily
- Use hierarchical permission structures
- Implement permission inheritance

### 6. **Testing**
- Test permission checks thoroughly
- Mock authentication context in tests
- Test edge cases and unauthorized access

---

## 8. Common Patterns

### Permission-Based UI Rendering

```typescript
function Dashboard() {
  const { user, hasPermission } = useAuth();
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {hasPermission('users.read') && (
        <UserList />
      )}
      
      {hasPermission('content.moderate') && (
        <ModerationPanel />
      )}
      
      {hasPermission('system.admin') && (
        <AdminPanel />
      )}
    </div>
  );
}
```

### Conditional Navigation

```typescript
function Navigation() {
  const { user } = useAuth();
  
  const navigationItems = [
    { label: 'Home', href: '/' },
    { label: 'Profile', href: '/profile' },
  ];
  
  if (hasPermission(user?.role, 'content.moderate')) {
    navigationItems.push({ label: 'Moderate', href: '/moderate' });
  }
  
  if (hasPermission(user?.role, 'system.admin')) {
    navigationItems.push({ label: 'Admin', href: '/admin' });
  }
  
  return (
    <nav>
      {navigationItems.map(item => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
```

---

## 9. Troubleshooting

### Common Issues

1. **Permission checks not working**
   - Verify JWT claims are properly set
   - Check role mapping in database
   - Ensure permission constants match

2. **Context not available**
   - Verify AuthProvider wraps your app
   - Check import paths
   - Ensure proper client/server component usage

3. **Route protection bypassed**
   - Verify middleware is properly configured
   - Check matcher patterns
   - Ensure server-side validation

### Debug Tips

```typescript
// Add to your AuthContext for debugging
useEffect(() => {
  console.log('Auth State:', {
    user: authUser,
    session,
    loading,
    role: authUser?.role,
    permissions: authUser?.role ? ROLE_PERMISSIONS[authUser.role] : []
  });
}, [authUser, session, loading]);
```

---

## 10. Migration Guide

### From Simple Role Checks

**Before:**
```typescript
if (user.role === 'ADMIN') {
  // Show admin panel
}
```

**After:**
```typescript
if (hasPermission(user.role, PERMISSIONS.SYSTEM_ADMIN)) {
  // Show admin panel
}
```

### From Multiple Role Checks

**Before:**
```typescript
if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
  // Show moderation panel
}
```

**After:**
```typescript
if (hasAnyPermission(user.role, [PERMISSIONS.CONTENT_MODERATE])) {
  // Show moderation panel
}
```

---

This architecture provides a robust, scalable foundation for role-based authentication that can be easily adapted to any project. The key is maintaining consistency in how permissions are defined, checked, and enforced throughout your application.
