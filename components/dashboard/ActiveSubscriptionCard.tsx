import { Dumbbell, Brain, Sparkles, Crown, Settings } from "lucide-react";
import { ActiveSubscriptionWithPlan } from "@/actions/subscriptions/get-active-subscriptions.action";
import Link from "next/link";
import Image from "next/image";

interface ActiveSubscriptionCardProps {
  subscriptions: ActiveSubscriptionWithPlan[];
}

export function ActiveSubscriptionCard({ subscriptions }: ActiveSubscriptionCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const categoryGradients = {
    FITNESS: "from-blue-500 to-purple-500",
    PSYCHOLOGY: "from-orange-500 to-red-500",
    MANIFESTATION: "from-purple-500 to-pink-500",
    ALL_IN_ONE: "from-green-500 to-emerald-500"
  };

  const categoryIcons = {
    FITNESS: (
      <div className={`rounded-full bg-gradient-to-r ${categoryGradients.FITNESS} w-10 h-10 flex items-center justify-center flex-shrink-0`}>
        <div className="relative w-6 h-6">
          <Image
            src="/fitness.svg"
            alt="Fitness Training"
            fill
            sizes="24px"
            className="object-contain"
            priority
          />
        </div>
      </div>
    ),
    PSYCHOLOGY: (
      <div className={`rounded-full bg-gradient-to-r ${categoryGradients.PSYCHOLOGY} w-10 h-10 flex items-center justify-center flex-shrink-0`}>
        <div className="relative w-6 h-6">
          <Image
            src="/brains.svg"
            alt="Psychological Support"
            fill
            sizes="24px"
            className="object-contain"
            priority
          />
        </div>
      </div>
    ),
    MANIFESTATION: (
      <div className={`rounded-full bg-gradient-to-r ${categoryGradients.MANIFESTATION} w-10 h-10 flex items-center justify-center flex-shrink-0`}>
        <div className="relative w-6 h-6">
          <Image
            src="/manifestation.png"
            alt="Manifestation Guidance"
            fill
            sizes="24px"
            className="object-contain"
            priority
          />
        </div>
      </div>
    ),
    ALL_IN_ONE: (
      <div className={`rounded-full bg-gradient-to-r ${categoryGradients.ALL_IN_ONE} w-10 h-10 flex items-center justify-center flex-shrink-0`}>
        <Crown className="h-6 w-6 text-white" />
      </div>
    )
  };

  return (
    <div className="border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Active Subscriptions</h2>
        <div className="px-3 py-1 bg-strentor-green/10 text-strentor-green rounded-full text-sm font-medium">
          {subscriptions.length} Active
        </div>
      </div>

      <div className="space-y-4">
        {subscriptions.map((subscription, index) => (
          <div
            key={subscription.id}
            className={`flex justify-between items-center ${
              index !== subscriptions.length - 1 ? 'border-b pb-4' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {categoryIcons[subscription.plan.category as keyof typeof categoryIcons] || (
                <div className="rounded-full bg-gradient-to-r from-gray-500 to-gray-600 w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <Crown className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <p className="font-bold text-lg">{subscription.plan.name}</p>
                <p className="text-muted-foreground text-sm">
                  {subscription.endDate ? `Expires: ${formatDate(subscription.endDate)}` : 'Active'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">₹{subscription.plan.price}</p>
              <p className="text-muted-foreground text-sm capitalize">
                {subscription.plan.billingPeriod}
              </p>
            </div>
          </div>
        ))}
      </div>

      {subscriptions.length > 1 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {subscriptions.length} active subscriptions (oldest first)
          </p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t">
        <Link 
          href="/settings/subscription" 
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <Settings className="h-4 w-4" />
          Manage Subscriptions
        </Link>
      </div>
    </div>
  );
} 