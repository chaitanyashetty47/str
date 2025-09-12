'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDefaultRouteForRole } from '@/lib/auth-utils';
import DashboardLayoutWrapper from "@/components/dashboard/dashboard-layout-admin";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, hasAdminAccess, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user && !hasAdminAccess) {
      setIsRedirecting(true);
      const defaultRoute = getDefaultRouteForRole(user.role);
      router.push(defaultRoute);
    }
  }, [user, hasAdminAccess, loading, router]);

  // Show skeleton loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8 space-y-8">
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show redirecting skeleton
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-8 space-y-8">
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
