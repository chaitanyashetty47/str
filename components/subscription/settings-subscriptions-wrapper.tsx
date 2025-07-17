'use client';

import { UserSubscriptionsTab } from './user-subscriptions-tab';
import { SettingsPricingSection } from './settings-pricing-section';

interface SettingsSubscriptionsWrapperProps {
  userId: string;
}

export function SettingsSubscriptionsWrapper({ userId }: SettingsSubscriptionsWrapperProps) {
  const handleSubscriptionSuccess = () => {
    // Refresh the page to show new subscription
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      <UserSubscriptionsTab 
        userId={userId} 
      />
      
      <div className="border-t pt-8">
        <SettingsPricingSection 
          userId={userId}
          onSubscriptionSuccess={handleSubscriptionSuccess}
        />
      </div>
    </div>
  );
} 