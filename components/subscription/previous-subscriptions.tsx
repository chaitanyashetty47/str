'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';
import { SubscriptionWithPlan } from '@/actions/subscriptions/get-user-subscriptions';

interface PreviousSubscriptionsProps {
  subscriptions: SubscriptionWithPlan[];
  onRefresh: () => void;
  userId: string;
}

export function PreviousSubscriptions({ subscriptions, onRefresh, userId }: PreviousSubscriptionsProps) {
  // Filter subscriptions to show only previous states
  const previousSubscriptions = subscriptions.filter(subscription => {
    // Show only cancelled, completed, expired states
    return (
      subscription.status === 'CANCELLED' ||
      subscription.status === 'COMPLETED' ||
      subscription.status === 'EXPIRED'
    );
  });

  const getStatusBadge = (subscription: SubscriptionWithPlan) => {
    switch (subscription.status) {
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-600 text-white">Completed</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="secondary">{subscription.status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FITNESS':
        return '💪';
      case 'PSYCHOLOGY':
        return '🧠';
      case 'MANIFESTATION':
        return '✨';
      case 'ALL_IN_ONE':
        return '🎯';
      default:
        return '📋';
    }
  };

  const renderCancelledCard = (subscription: SubscriptionWithPlan) => {
    return (
      <Card key={subscription.id} className="border-gray-200 bg-gray-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getCategoryIcon(subscription.plan.category)}</span>
              <div>
                <CardTitle className="text-lg">{subscription.plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {subscription.plan.category.toLowerCase().replace('_', ' ')} Plan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(subscription)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Ended On</p>
                  <p className="text-muted-foreground">
                    {formatDate(subscription.endDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-muted-foreground">
                    {subscription.startDate && subscription.endDate ? 
                      `${Math.ceil((new Date(subscription.endDate).getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
              <div>
                <p className="font-medium">₹{subscription.plan.price}</p>
                <p className="text-muted-foreground">per {subscription.plan.billingPeriod}</p>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-800">
                <strong>Subscription Cancelled</strong>
              </p>
              <p className="text-sm text-gray-700 mt-2">
                Your subscription ended on {formatDate(subscription.endDate)}. 
                You no longer have access to premium features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCompletedCard = (subscription: SubscriptionWithPlan) => {
    return (
      <Card key={subscription.id} className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getCategoryIcon(subscription.plan.category)}</span>
              <div>
                <CardTitle className="text-lg">{subscription.plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {subscription.plan.category.toLowerCase().replace('_', ' ')} Plan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(subscription)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Completed On</p>
                  <p className="text-muted-foreground">
                    {formatDate(subscription.endDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-muted-foreground">
                    {subscription.startDate && subscription.endDate ? 
                      `${Math.ceil((new Date(subscription.endDate).getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
              <div>
                <p className="font-medium">₹{subscription.plan.price}</p>
                <p className="text-muted-foreground">per {subscription.plan.billingPeriod}</p>
              </div>
            </div>
            
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Subscription Completed Successfully</strong>
              </p>
              <p className="text-sm text-green-700 mt-2">
                Your subscription completed successfully on {formatDate(subscription.endDate)}. 
                Thank you for using our service!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderExpiredCard = (subscription: SubscriptionWithPlan) => {
    return (
      <Card key={subscription.id} className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getCategoryIcon(subscription.plan.category)}</span>
              <div>
                <CardTitle className="text-lg">{subscription.plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground capitalize">
                  {subscription.plan.category.toLowerCase().replace('_', ' ')} Plan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(subscription)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Expired On</p>
                  <p className="text-muted-foreground">
                    {formatDate(subscription.endDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Duration</p>
                  <p className="text-muted-foreground">
                    {subscription.startDate && subscription.endDate ? 
                      `${Math.ceil((new Date(subscription.endDate).getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24))} days` : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
              <div>
                <p className="font-medium">₹{subscription.plan.price}</p>
                <p className="text-muted-foreground">per {subscription.plan.billingPeriod}</p>
              </div>
            </div>
            
            <div className="bg-orange-100 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Subscription Expired</strong>
              </p>
              <p className="text-sm text-orange-700 mt-2">
                Your subscription expired on {formatDate(subscription.endDate)}. 
                You no longer have access to premium features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (previousSubscriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          <CreditCard className="mx-auto h-12 w-12 mb-2" />
          <p>No previous subscriptions found</p>
          <p className="text-sm mt-1">When you cancel or complete subscriptions, they'll appear here for reference.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scrollable container for previous subscriptions */}
      <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
        {previousSubscriptions.map((subscription) => {
          switch (subscription.status) {
            case 'CANCELLED':
              return renderCancelledCard(subscription);
            case 'COMPLETED':
              return renderCompletedCard(subscription);
            case 'EXPIRED':
              return renderExpiredCard(subscription);
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}