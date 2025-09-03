"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { ProfileForm } from "@/components/profile/profile-form";
import { SettingsSubscriptionsWrapper } from "@/components/subscription/settings-subscriptions-wrapper";
import { getProfileDetails } from "@/actions/profile/get-profile-details.action";
import { getActiveSubscriptions } from "@/actions/subscriptions/get-active-subscriptions.action";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SettingsContentProps {
  user: User;
}

export function SettingsContent({ user }: SettingsContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Data management
  const [profileData, setProfileData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  

  const activeTab = pathname.includes('/subscription') ? 'subscription' : 'profile';

  // Fetch all data once on component mount
  useEffect(() => {
    console.log("fetching all data again");
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both profile and subscription data in parallel
        const [profileResult, subscriptionResult] = await Promise.all([
          getProfileDetails(),
          getActiveSubscriptions({})
        ]);

        // Handle profile data
        if (profileResult) {
          setProfileData(profileResult);
        } else {
          throw new Error("Failed to load profile data");
        }

        // Handle subscription data
        if (subscriptionResult.error) {
          console.error("Subscription fetch error:", subscriptionResult.error);
          // Don't fail completely for subscription errors
          setSubscriptionData([]);
        } else if (subscriptionResult.data) {
          setSubscriptionData(subscriptionResult.data);
        } else {
          setSubscriptionData([]);
        }

      } catch (error) {
        console.error("Error fetching settings data:", error);
        setError("Failed to load settings data");
        toast.error("Failed to load settings data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []); // Only run once on mount

  // Refresh profile data after updates
  const refreshProfileData = async () => {
    try {
      const updatedProfile = await getProfileDetails();
      setProfileData(updatedProfile);
    } catch (error) {
      console.error("Error refreshing profile:", error);
      toast.error("Failed to refresh profile data");
    }
  };

  // Refresh subscription data after updates  
  const refreshSubscriptionData = async () => {
    try {
      const result = await getActiveSubscriptions({});
      if (result.error) {
        console.error("Error refreshing subscriptions:", result.error);
      } else if (result.data) {
        setSubscriptionData(result.data);
      }
    } catch (error) {
      console.error("Error refreshing subscriptions:", error);
    }
  };

  const handleTabChange = (tab: 'profile' | 'subscription') => {
    //setActiveTab(tab);
    
    // Update URL without page refresh
    if (tab === 'subscription') {
      router.push('/settings/subscription');
    } else {
      router.push('/settings');
    }
  };

  const tabButtonClass = (tabValue: string) => cn(
    "inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-all cursor-pointer",
    "border-b-2 border-transparent rounded-none bg-transparent",
    activeTab === tabValue 
      ? "border-red-500 text-red-600" 
      : "text-gray-500 hover:text-gray-700"
  );

  // Show loading state during initial data fetch
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-red-600 rounded-full" />
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if data fetching failed
  if (error) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <p className="text-sm text-destructive mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Custom Tab Navigation */}
      <div className="inline-flex h-12 items-center justify-start bg-transparent border-b border-gray-200 p-0 w-full rounded-none mb-6">
        <button
          onClick={() => handleTabChange('profile')}
          className={tabButtonClass('profile')}
        >
          Profile
        </button>
        <button
          onClick={() => handleTabChange('subscription')}
          className={tabButtonClass('subscription')}
        >
          Your Subscriptions
        </button>
      </div>

      {/* Content Container - Both components are always rendered for caching */}
      <div className="relative">
        {/* Profile Content */}
        <div 
          className={cn(
            "transition-all duration-200",
            activeTab === 'profile' ? 'block' : 'hidden'
          )}
        >
          <ProfileForm 
            user={user} 
            initialData={profileData}
            onDataUpdate={refreshProfileData}
          />
        </div>

        {/* Subscription Content */}
        <div 
          className={cn(
            "transition-all duration-200",
            activeTab === 'subscription' ? 'block' : 'hidden'
          )}
        >
          <SettingsSubscriptionsWrapper 
            userId={user.id} 
            initialData={subscriptionData}
            onDataUpdate={refreshSubscriptionData}
          />
        </div>
      </div>
    </div>
  );
}