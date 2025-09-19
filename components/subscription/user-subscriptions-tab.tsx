'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getUserSubscriptions, SubscriptionWithPlan } from '@/actions/subscriptions/get-user-subscriptions';
import { useAction } from '@/hooks/useAction';
import { UserSubscriptions } from './user-subscriptions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserSubscriptionsTabProps {
  userId: string;
  initialData?: any; // Optional pre-loaded subscription data
  onDataUpdate?: () => void; // Callback to refresh parent data
  userData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export function UserSubscriptionsTab({ userId, initialData, onDataUpdate, userData }: UserSubscriptionsTabProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPlan[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Memoize the callbacks to prevent unnecessary re-renders
  const onSuccess = useCallback((data: SubscriptionWithPlan[]) => {
    if (data) {
      setSubscriptions(data);
    }
  }, []);

  const onError = useCallback((error: string) => {
    console.error('Failed to fetch subscriptions:', error);
  }, []);

  //options stays same refence after first render

  const actionOptions = useMemo(() => ({onSuccess, onError}), [onSuccess, onError]);

  const { 
    execute: fetchSubscriptions, 
    isLoading, 
    error 
  } = useAction(getUserSubscriptions, actionOptions);


  useEffect(() => {
    // If initialData is provided, use it instead of fetching
    if (initialData) {
      setSubscriptions(initialData);
      return;
    }

    // Otherwise, fetch subscription data as before
    fetchSubscriptions({ userId });
  }, [userId, fetchSubscriptions, initialData]);

  // Update subscriptions when initialData changes (parent refresh)
  useEffect(() => {
    if (initialData) {
      setSubscriptions(initialData);
    }
  }, [initialData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      if (initialData) {
        // If using cached data, notify parent to refresh
        onDataUpdate?.();
        // Add a small delay to show the spinning animation
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Otherwise, fetch directly
        await fetchSubscriptions({ userId });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchSubscriptions, userId, initialData, onDataUpdate]);

  if (isLoading && subscriptions.length === 0 && !initialData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24 mt-1" />
                </div>
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load subscriptions: {error}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
            {(isLoading || isRefreshing) ? 'Retrying...' : 'Retry'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Your Subscriptions</h3>
          <p className="text-sm text-muted-foreground">
            Manage your active subscriptions and billing
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
          {(isLoading || isRefreshing) ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <UserSubscriptions 
        subscriptions={subscriptions}
        onRefresh={handleRefresh}
        userId={userId}
        userData={userData}
      />
    </div>
  );
} 