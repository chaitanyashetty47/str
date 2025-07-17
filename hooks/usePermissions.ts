import { useAuth } from './useAuth';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/auth-utils';

export function usePermissions() {
  const { user } = useAuth();

  return {
    hasPermission: (permission: string) => 
      user ? hasPermission(user.role, permission) : false,
    
    hasAnyPermission: (permissions: string[]) =>
      user ? hasAnyPermission(user.role, permissions) : false,
    
    hasAllPermissions: (permissions: string[]) =>
      user ? hasAllPermissions(user.role, permissions) : false,
    
    canManageClients: () => 
      user ? hasPermission(user.role, 'clients.manage') : false,
    
    canCreatePlans: () =>
      user ? hasPermission(user.role, 'plans.create') : false,
    
    canViewAdminPanel: () =>
      user ? hasPermission(user.role, 'admin.view_all') : false,
  };
}