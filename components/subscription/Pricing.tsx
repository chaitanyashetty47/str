"use client";
import { useState } from "react";
import { PricingHeader } from "@/components/subscription/PricingHeader";
import { PricingCard } from "@/components/subscription/PricingCard";
import { SubscriptionPlan } from "@/types/subscription";

const billingOptions = [
  { label: "Quarterly", value: 3 },
  { label: "Semi-Annual", value: 6 },
  { label: "Annual", value: 12 },
];

export const Pricing = ({ plans }: { plans: SubscriptionPlan[] }) => {
  const [selectedCycle, setSelectedCycle] = useState<number>(3);

  const filteredPlans = plans.filter(
    (plan) => plan.billing_cycle === selectedCycle
  );

  return (
    <section className="flex flex-col items-center gap-10 py-10">
      <PricingHeader
        title="Plans and Pricing"
        subtitle="Pick the plan that fits your goals. Save more on longer commitments."
        options={billingOptions}
        selected={selectedCycle}
        onSelect={setSelectedCycle}
      />
      <div className="grid w-full max-w-6xl gap-6 sm:grid-cols-4 xl:grid-cols-4">
        {filteredPlans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} selectedCycle={selectedCycle} />
        ))}
      </div>
    </section>
  );
};
