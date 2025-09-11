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
  FITNESS: "from-blue-500 to-purple-500",
};

const categoryIcons = {
  FITNESS: (
    <div className={`rounded-full bg-gradient-to-r ${categoryGradients.FITNESS} w-12 h-12 flex items-center justify-center flex-shrink-0`}>
      <div className="relative w-8 h-8">
        <Image
          src="/fitness.svg"
          alt="Fitness Training"
          fill
          sizes="32px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  ),
};

const fitnessPlan = {
  name: "The Strength Rebuild Blueprint",
  description: "Build physical strength, mobility, and confidence — no matter your physical challenge",
  features: [
    "12 Weeks Intensive + Follow-Up Support",
    "Weekly Goal-Oriented Coaching Call",
    "Monthly 1:1 Strategy & Evaluation (3 total)",
    "Daily Accountability Submissions",
    "Unlimited WhatsApp/Text Support",
    "Results Guarantee",
    "Kickstart 1:1 Fitness Deep-Dive (30 min)",
    "Custom adaptive fitness blueprint and progression map",
    "Modified strength training suited to your condition",
    "Goal-based programs: muscle gain, fat loss, endurance, or rehab"
  ],
  pricing: {
    3: { original: 75000, discounted: 67500 },
    6: { original: 150000, discounted: 120000 },
    12: { original: 300000, discounted: 210000 }
  }
};

export default function FitnessPricing() {
  const [selectedCycle, setSelectedCycle] = useState<number>(3);
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/sign-in');
  };

  const pricing = fitnessPlan.pricing[selectedCycle as keyof typeof fitnessPlan.pricing];

  return (
    <div id="fitness-pricing-section" className="relative w-full overflow-hidden py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Pricing Header with Billing Cycle Tabs */}
        <PricingHeader
          title="Choose Your Fitness Plan"
          subtitle="Invest in your physical transformation with our comprehensive strength coaching program"
          options={billingOptions}
          selected={selectedCycle}
          onSelect={setSelectedCycle}
        />

        {/* Single Fitness Card - Centered */}
        <div className="flex justify-center mt-12">
          <div className="w-full max-w-md">
            <Card className="h-full flex flex-col overflow-hidden rounded-2xl border p-8 shadow bg-background border-blue-200">
              {/* Header Section */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {categoryIcons.FITNESS}
                  <CardTitle className="text-xl">{fitnessPlan.name}</CardTitle>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6">
                  {fitnessPlan.description}
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
                  {fitnessPlan.features.map((feature: string, index: number) => (
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
                  Get Started with Fitness Plan
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}