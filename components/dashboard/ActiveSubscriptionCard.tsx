import { Dumbbell, Brain, Sparkles, Crown } from "lucide-react";
import { ActiveSubscriptionWithPlan } from "@/actions/subscriptions/get-active-subscriptions.action";

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

  const getIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "fitness":
        return <Dumbbell className="h-5 w-5 text-blue-700" />
      case "psychology":
        return <Brain className="h-5 w-5 text-purple-700" />
      case "manifestation":
        return <Sparkles className="h-5 w-5 text-amber-700" />
      case "all_in_one":
        return <Crown className="h-5 w-5 text-green-700" />
      default:
        return <Dumbbell className="h-5 w-5 text-gray-700" />
    }
  }

  const getIconBg = (category: string) => {
    switch (category.toLowerCase()) {
      case "fitness":
        return "bg-blue-100"
      case "psychology":
        return "bg-purple-100"
      case "manifestation":
        return "bg-amber-100"
      case "all_in_one":
        return "bg-green-100"
      default:
        return "bg-gray-100"
    }
  }

  return (
    <div className="border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Active Subscriptions</h2>
        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
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
              <div className={`${getIconBg(subscription.plan.category)} p-3 rounded-full`}>
                {getIcon(subscription.plan.category)}
              </div>
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
    </div>
  );
} 