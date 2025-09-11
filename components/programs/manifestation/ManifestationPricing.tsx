"use client";

import React, { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";
import Image from "next/image";
import { PricingHeader } from "@/components/subscription/PricingHeader";
import { useRouter } from "next/navigation";

const billingOptions = [
  { label: "Quarterly", value: 3, discount: 10 },
  { label: "Semi-Annual", value: 6, discount: 20 },
  { label: "Annual", value: 12, discount: 30 },
];

const categoryGradients = {
  MANIFESTATION: "from-purple-500 to-pink-500",
};

const categoryIcons = {
  MANIFESTATION: (
    <div className={`rounded-full bg-gradient-to-r ${categoryGradients.MANIFESTATION} w-12 h-12 flex items-center justify-center flex-shrink-0`}>
      <div className="relative w-8 h-8">
        <Image
          src="/manifestation.png"
          alt="Manifestation Guidance"
          fill
          sizes="32px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  ),
};

const manifestationPlan = {
  name: "The Manifestation Mastery Blueprint",
  description: "Break through limitations, rewire your beliefs, and live in alignment with purpose using quantum + practical methods",
  features: [
    "12 Weeks Intensive + Follow-Up Support",
    "Weekly Live Coaching Call with Manifestation Coach",
    "Monthly 1:1 Strategy & Evaluation (3 total)",
    "Weekly Accountability Submissions",
    "Unlimited WhatsApp/Text Support",
    "Results Guarantee",
    "Kickstart 1:1 Alignment Mapping (30 min)",
    "Clarify life vision, energy leaks, and self-concept",
    "Personalized manifestation map",
    "Weekly Quantum + Action Coaching (12 live)",
    "Rewrite limiting beliefs",
    "Manifestation through aligned action",
    "Monthly 1:1 Realignment Sessions",
    "Weekly rituals: action plans, progress check-in, embodiment check-in",
    "Unlimited WhatsApp for energy resets, belief coaching"
  ],
  pricing: {
    3: { original: 75000, discounted: 67500 },
    6: { original: 150000, discounted: 120000 },
    12: { original: 300000, discounted: 210000 }
  }
};

export default function ManifestationPricing() {
  const [selectedCycle, setSelectedCycle] = useState<number>(3);
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/sign-in');
  };

  const pricing = manifestationPlan.pricing[selectedCycle as keyof typeof manifestationPlan.pricing];

  return (
    <div id="manifestation-pricing-section" className="relative w-full overflow-hidden py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Pricing Header with Billing Cycle Tabs */}
        <PricingHeader
          title="Choose Your Manifestation Plan"
          subtitle="Invest in your spiritual and personal transformation with our comprehensive manifestation coaching program"
          options={billingOptions}
          selected={selectedCycle}
          onSelect={setSelectedCycle}
        />

        {/* Single Manifestation Card - Centered */}
        <div className="flex justify-center mt-12">
          <div className="w-full max-w-md">
            <Card className="h-full flex flex-col overflow-hidden rounded-2xl border p-8 shadow bg-background border-orange-200">
              {/* Header Section */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {categoryIcons.MANIFESTATION}
                  <CardTitle className="text-xl">{manifestationPlan.name}</CardTitle>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6">
                  {manifestationPlan.description}
                </p>
                
                {/* Price Section */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-medium text-muted-foreground line-through">
                      ₹{pricing.original.toLocaleString()}
                    </span>
                    <span className="text-4xl font-medium text-green-600">
                      ₹{pricing.discounted.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mt-2">
                    Billed every {selectedCycle} months
                  </p>
                </div>
              </div>
              
              {/* Features Section - Show All Features */}
              <div className="flex-1 mb-6">
                <ul className="space-y-3">
                  {manifestationPlan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-3 text-sm font-medium text-foreground/60">
                      <BadgeCheck strokeWidth={1} size={16} className="text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Button Section */}
              <div className="mt-auto">
                <Button
                  onClick={handleGetStarted}
                  className="w-full bg-strentor-red hover:bg-strentor-red/90 text-white py-3 text-lg font-semibold"
                >
                  Get Started with Manifestation Plan
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}