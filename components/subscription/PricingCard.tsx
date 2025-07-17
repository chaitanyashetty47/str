// PricingCard.tsx
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscribeButton } from "@/components/subscription/subscribe-button";
import { SubscriptionPlan } from "@/types/subscription";

export const PricingCard = ({ plan, selectedCycle }: { plan: SubscriptionPlan, selectedCycle: number }) => {
  return (
    <div className="relative flex flex-col gap-8 overflow-hidden rounded-2xl border p-6 shadow bg-background text-foreground">
      <h2 className="text-xl font-medium capitalize">{plan.name}</h2>
      <div className="relative h-12">
        <h1 className="text-4xl font-medium">₹{(plan.price).toLocaleString()}</h1>
        <p className="-mt-2 text-xs font-medium">Billed every {plan.billing_cycle} months</p>
      </div>

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

      

      <SubscribeButton
        razorpayPlanId={plan.razorpay_plan_id}
        selectedCycle={selectedCycle}
        buttonText="Subscribe"
        className="w-full rounded-lg"
      />
    </div>
  );
};