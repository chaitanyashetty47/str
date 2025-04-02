"use client";

import { useEffect, useState } from 'react';
import { Dumbbell, Brain, Sparkles, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchUserSubscriptions } from '@/utils/razorpay';
import { SubscriptionWithPlan } from '@/actions/user-subscription.action';

export default function ActiveSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscriptions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await fetchUserSubscriptions();
        
        if (result.error) {
          setError(result.error);
        } else {
          setSubscriptions(result.data);
        }
      } catch (err) {
        setError('Failed to load subscriptions');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getIcon = (category: string) => {
    switch (category) {
      case "fitness":
        return <Dumbbell className="h-5 w-5 text-gray-700" />
      case "psychology":
        return <Brain className="h-5 w-5 text-purple-700" />
      case "manifestation":
        return <Sparkles className="h-5 w-5 text-amber-700" />
      default:
        return <Dumbbell className="h-5 w-5 text-gray-700" />
    }
  }

  const getIconBg = (category: string) => {
    switch (category) {
      case "fitness":
        return "bg-blue-100"
      case "psychology":
        return "bg-purple-100"
      case "manifestation":
        return "bg-amber-100"
      default:
        return "bg-gray-100"
    }
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-1">Active Subscriptions</h2>
        <p className="text-muted-foreground mb-6">Your current active plans</p>
        <div className="flex justify-center p-2 text-muted-foreground">
          Loading your subscriptions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-1">Active Subscriptions</h2>
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load your subscriptions. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-1">Active Subscriptions</h2>
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Active Subscriptions</AlertTitle>
          <AlertDescription>
            You don't have any active subscriptions at the moment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filter to only show active subscriptions
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-1">Active Subscriptions</h2>
      <p className="text-muted-foreground mb-6">Your current active plans</p>

      <div className="space-y-6">
        {activeSubscriptions.map((subscription) => (
          <div
            key={subscription.id}
            className="flex justify-between items-center border-b pb-6 last:border-0 last:pb-0"
          >
            <div className="flex items-center gap-3">
              <div className={`${getIconBg(subscription.subscription_plans.category)} p-3 rounded-full`}>
                {getIcon(subscription.subscription_plans.category)}
              </div>
              <div>
                <p className="font-bold text-lg">{subscription.subscription_plans.name}</p>
                <p className="text-muted-foreground">Expires: {formatDate(subscription.end_date)}</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Active</div>
          </div>
        ))}
      </div>
    </div>
  )
}

