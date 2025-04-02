"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { fetchUserSubscriptions, cancelSubscription } from '@/utils/razorpay';
import { AlertCircle, CheckCircle2, Calendar, Hourglass, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SubscriptionWithPlan } from '@/actions/user-subscription.action';

export function ActiveSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

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

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription? You will still have access until the end of your current billing period.')) {
      return;
    }
    
    setCancellingId(subscriptionId);
    
    try {
      const result = await cancelSubscription(subscriptionId);
      
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Subscription Cancelled',
          description: 'Your subscription has been cancelled successfully. You will have access until the end of your current billing period.',
        });
        
        // Refresh subscriptions list
        loadSubscriptions();
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
      case 'canceled':
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      case 'expired':
        return <Badge variant="destructive"><Hourglass className="w-3 h-3 mr-1" /> Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Helper function to render features safely
  const renderFeatures = (features: any) => {
    if (!features) return null;
    
    if (Array.isArray(features)) {
      return features.map((feature: any, index: number) => {
        // Handle feature objects with name/included structure
        if (typeof feature === 'object' && feature !== null && 'name' in feature) {
          return <li key={index} className="text-sm">{String(feature.name)}</li>;
        }
        // Handle simple string features
        return <li key={index} className="text-sm">{typeof feature === 'string' ? feature : JSON.stringify(feature)}</li>;
      });
    } 
    
    if (typeof features === 'object') {
      return Object.entries(features).map(([key, value]: [string, any]) => {
        // If this is an object with name/included pattern
        if (key === 'name' && typeof value === 'string') {
          return <li key={key} className="text-sm">{value}</li>;
        }
        
        // If the value is an object with name/included structure
        if (typeof value === 'object' && value !== null && 'name' in value) {
          const featureName = String(value.name); // Cast to string to satisfy TypeScript
          return <li key={key} className="text-sm">{featureName}</li>;
        }
        
        // Skip rendering "included" property directly
        if (key === 'included') {
          return null;
        }
        
        // Handle other types of values
        if (typeof value === 'object' && value !== null) {
          // Safe access to potentially missing 'name' property with type checking
          const nameValue = 'name' in value ? String(value.name) : '';
          return <li key={key} className="text-sm">{nameValue || JSON.stringify(value)}</li>;
        }
        
        return <li key={key} className="text-sm">{String(value)}</li>;
      }).filter(Boolean); // Filter out null items
    }

    return <li className="text-sm">No features available</li>;
  };

  if (isLoading) {
    return <div className="flex justify-center p-6">Loading your subscriptions...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load your subscriptions. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Active Subscriptions</AlertTitle>
        <AlertDescription>
          You don't have any active subscriptions at the moment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Subscriptions</h2>
      
      {subscriptions.map((subscription) => (
        <Card key={subscription.id} className="mb-4">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{subscription.subscription_plans.name}</CardTitle>
                <CardDescription className="capitalize">{subscription.subscription_plans.category} Plan</CardDescription>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Start:</strong> {formatDate(subscription.start_date)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  <strong>End:</strong> {formatDate(subscription.end_date)}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">
                  <strong>Price:</strong> ₹{subscription.subscription_plans.price}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm capitalize">
                  <strong>Billing:</strong> {subscription.subscription_plans.billing_period}
                </span>
              </div>
            </div>
            
            {subscription.subscription_plans.features && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Features:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {renderFeatures(subscription.subscription_plans.features)}
                </ul>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            {subscription.status === 'active' && (
              <Button 
                variant="outline" 
                onClick={() => handleCancel(subscription.razorpay_subscription_id)}
                disabled={cancellingId === subscription.razorpay_subscription_id}
              >
                {cancellingId === subscription.razorpay_subscription_id ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 