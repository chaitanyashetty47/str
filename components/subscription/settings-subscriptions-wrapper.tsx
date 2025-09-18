'use client';

import { UserSubscriptionsTab } from './user-subscriptions-tab';
import { SettingsPricingSection } from './settings-pricing-section';

interface SettingsSubscriptionsWrapperProps {
  userId: string;
  initialData?: any; // Optional pre-loaded subscription data
  onDataUpdate?: () => void; // Callback to refresh parent data
  userData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export function SettingsSubscriptionsWrapper({ userId, initialData, onDataUpdate, userData }: SettingsSubscriptionsWrapperProps) {
  const handleSubscriptionSuccess = () => {
    // Notify parent to refresh data instead of reloading page
    onDataUpdate?.();
  };

  return (
    <div className="space-y-8">
      <UserSubscriptionsTab 
        userId={userId} 
        initialData={initialData}
        onDataUpdate={onDataUpdate}
        userData={userData}
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