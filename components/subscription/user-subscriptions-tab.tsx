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
}

export function UserSubscriptionsTab({ userId }: UserSubscriptionsTabProps) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPlan[]>([]);

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
    fetchSubscriptions({ userId });
  }, [userId, fetchSubscriptions]);

  const handleRefresh = useCallback(() => {
    fetchSubscriptions({ userId });
  }, [fetchSubscriptions, userId]);

  if (isLoading && subscriptions.length === 0) {
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
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Retry
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
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <UserSubscriptions 
        subscriptions={subscriptions}
        onRefresh={handleRefresh}
        userId={userId}
      />
    </div>
  );
} 