// PricingCard.tsx
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscribeButton } from "@/components/subscription/subscribe-button";
import { SubscriptionPlan } from "@/types/subscription";

export const PricingCard = ({ plan, selectedCycle }: { plan: SubscriptionPlan, selectedCycle: number }) => {
  return (
    <div className="relative flex flex-col h-full overflow-hidden rounded-2xl border p-6 shadow bg-background text-foreground">
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-xl font-medium capitalize mb-4">{plan.name}</h2>
        
        {/* Price Section - Fixed Height for Alignment */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <h1 className="text-4xl font-medium">₹{(plan.price).toLocaleString()}</h1>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            Billed every {plan.billing_cycle} months
          </p>
        </div>
      </div>

      {/* Features Section - Flexible Height */}
      <div className="flex-1 mb-6">
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li
              key={index}
              className={cn("flex items-center gap-2 text-sm font-medium text-foreground/60")}
            >
              <BadgeCheck strokeWidth={1} size={16} />
              {feature.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Button Section - Always at Bottom */}
      <div className="mt-auto">
        <SubscribeButton
          razorpayPlanId={plan.razorpay_plan_id}
          selectedCycle={selectedCycle}
          buttonText="Subscribe"
          className="w-full rounded-lg bg-strentor-red hover:bg-strentor-red/80"
        />
      </div>
    </div>
  );
};