'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { updateSubscription } from '@/actions/subscriptions/update-subscription.action';
import { getAvailablePlanChanges } from '@/actions/subscriptions/get-available-plan-changes.action';
import { SubscriptionCategory } from '@prisma/client';

export interface ChangePlanState {
  isOpen: boolean;
  selectedSubscription: any | null;
  availablePlanChanges: any | null;
  isUpdating: boolean;
}

export function useChangePlan(userId: string, onSuccess?: () => void) {
  const [state, setState] = useState<ChangePlanState>({
    isOpen: false,
    selectedSubscription: null,
    availablePlanChanges: null,
    isUpdating: false
  });

  const openChangePlan = async (subscription: any) => {
    setState(prev => ({
      ...prev,
      selectedSubscription: subscription,
      isUpdating: false
    }));
    
    try {
      // Fetch available plan changes
      const result = await getAvailablePlanChanges({ userId });
      if (result.data) {
        setState(prev => ({
          ...prev,
          availablePlanChanges: result.data,
          isOpen: true
        }));
      } else {
        toast.error('Failed to load plan options');
      }
    } catch (error) {
      console.error('Failed to fetch plan changes:', error);
      toast.error('Failed to load plan options');
    }
  };

  const openChangePlanByCategory = async (category: SubscriptionCategory) => {
    try {
      // Find the user's subscription for this category
      const result = await getAvailablePlanChanges({ userId });
      if (result.data) {
        // Find the subscription data for this category
        const subscriptionData = result.data.availableChanges.find(
          (change: any) => change.currentPlan.category === category
        );
        
        if (subscriptionData) {
          setState(prev => ({
            ...prev,
            selectedSubscription: { 
              id: subscriptionData.subscriptionId,
              plan: subscriptionData.currentPlan 
            },
            availablePlanChanges: result.data,
            isOpen: true,
            isUpdating: false
          }));
        } else {
          toast.error('No subscription found for this category');
        }
      } else {
        toast.error('Failed to load plan options');
      }
    } catch (error) {
      console.error('Failed to fetch plan changes:', error);
      toast.error('Failed to load plan options');
    }
  };

  const updatePlan = async (newPlanId: string) => {
    if (!state.selectedSubscription) return;
    
    setState(prev => ({ ...prev, isUpdating: true }));
    
    try {
      const result = await updateSubscription({
        userId,
        subscriptionId: state.selectedSubscription.id,
        newPlanId,
      });
      
      if (result.data) {
        toast.success('Plan updated successfully', {
          description: 'Your subscription has been updated and will take effect immediately.',
        });
        closeChangePlan();
        onSuccess?.();
      } else {
        toast.error('Failed to update plan', {
          description: result.error || 'Please try again later.',
        });
      }
    } catch (error) {
      console.error('Failed to update plan:', error);
      toast.error('Failed to update plan');
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  };

  const closeChangePlan = () => {
    setState({
      isOpen: false,
      selectedSubscription: null,
      availablePlanChanges: null,
      isUpdating: false
    });
  };

  return {
    state,
    openChangePlan,
    openChangePlanByCategory,
    updatePlan,
    closeChangePlan
  };
} 