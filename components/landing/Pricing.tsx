"use client";

import React, { useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, BadgeCheck } from "lucide-react";
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

const pricingData = {
  FITNESS: {
    name: "The Strength Rebuild Blueprint",
    description: "Build physical strength, mobility, and confidence",
    features: [
      "12 Weeks Intensive + Follow-Up Support",
      "Weekly Goal-Oriented Coaching Call",
      "Monthly 1:1 Strategy & Evaluation (3 total)",
      "Daily Accountability Submissions",
      "Unlimited WhatsApp/Text Support",
      "Results Guarantee"
    ],
    pricing: {
      3: { original: 75000, discounted: 67500 },
      6: { original: 150000, discounted: 120000 },
      12: { original: 300000, discounted: 210000 }
    }
  },
  PSYCHOLOGY: {
    name: "The Emotional Clarity Blueprint",
    description: "Mental peace, emotional regulation, and personal resilience",
    features: [
      "12 Weeks Intensive + Follow-Up Support",
      "Weekly Live Coaching Call with Certified Psychologist",
      "Monthly 1:1 Strategy & Evaluation (3 total)",
      "Daily Accountability Submissions",
      "Unlimited WhatsApp/Text Support",
      "Results Guarantee"
    ],
    pricing: {
      3: { original: 75000, discounted: 67500 },
      6: { original: 150000, discounted: 120000 },
      12: { original: 300000, discounted: 210000 }
    }
  },
  MANIFESTATION: {
    name: "The Manifestation Mastery Blueprint",
    description: "Break through limitations and live in alignment with purpose",
    features: [
      "12 Weeks Intensive + Follow-Up Support",
      "Weekly Live Coaching Call with Manifestation Coach",
      "Monthly 1:1 Strategy & Evaluation (3 total)",
      "Weekly Accountability Submissions",
      "Unlimited WhatsApp/Text Support",
      "Results Guarantee"
    ],
    pricing: {
      3: { original: 75000, discounted: 67500 },
      6: { original: 150000, discounted: 120000 },
      12: { original: 300000, discounted: 210000 }
    }
  },
  ALL_IN_ONE: {
    name: "Complete Transformation Blueprint",
    description: "Everything in Fitness + Psychology + Manifestation",
    features: [
      "Everything in Fitness + Psychology + Manifestation",
      "12 Weeks Intensive + Follow-Up Support",
      "Weekly Live Coaching Calls (All 3 Coaches)",
      "Monthly 1:1 Strategy & Evaluation (3 total)",
      "Daily Accountability Submissions",
      "Unlimited WhatsApp/Text Support",
      "Results Guarantee"
    ],
    pricing: {
      3: { original: 225000, discounted: 202500 },
      6: { original: 450000, discounted: 360000 },
      12: { original: 900000, discounted: 630000 }
    }
  }
};

export default function Pricing() {
  const [selectedCycle, setSelectedCycle] = useState<number>(3);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/sign-in');
  };

  const toggleExpansion = (category: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const getCategoryBorderClass = (category: string) => {
    switch (category) {
      case 'FITNESS': return 'border-blue-200';
      case 'PSYCHOLOGY': return 'border-purple-200';
      case 'MANIFESTATION': return 'border-orange-200';
      case 'ALL_IN_ONE': return 'border-green-200';
      default: return 'border-gray-200';
    }
  };

  const getDiscountPercentage = (cycle: number) => {
    return cycle === 3 ? 10 : cycle === 6 ? 20 : 30;
  };

  return (
    <div id="pricing-section" className="relative w-full overflow-hidden py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Pricing Header with Billing Cycle Tabs */}
        <PricingHeader
          title="Choose Your Transformation Plan"
          subtitle="Invest in yourself with our comprehensive coaching programs"
          options={billingOptions}
          selected={selectedCycle}
          onSelect={setSelectedCycle}
        />

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {Object.entries(pricingData).map(([category, plan]) => {
            const pricing = plan.pricing[selectedCycle as keyof typeof plan.pricing];
            const discountPercentage = getDiscountPercentage(selectedCycle);
            const isAllInOne = category === 'ALL_IN_ONE';
            
            return (
              <Card 
                key={category}
                className={`h-full flex flex-col overflow-hidden rounded-2xl border p-6 shadow bg-background ${getCategoryBorderClass(category)} ${
                  isAllInOne ? 'ring-2 ring-green-500 bg-gradient-to-br from-green-50 to-emerald-50' : ''
                } relative`}
              >
                {/* Floating Most Popular Badge */}
                {isAllInOne && (
                  <Badge variant="default" className="absolute top-4 right-4 bg-green-500 z-10">
                    Most Popular
                  </Badge>
                )}
                
                {/* Header Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    {categoryIcons[category as keyof typeof categoryIcons]}
                    <CardTitle className={`text-lg leading-tight ${isAllInOne ? 'pr-20' : ''}`}>
                      {plan.name}
                    </CardTitle>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>
                  
                  {/* Price Section */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-medium text-muted-foreground line-through">
                        ₹{pricing.original.toLocaleString()}
                      </span>
                      <span className="text-3xl font-medium text-green-600">
                        ₹{pricing.discounted.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Billed every {selectedCycle} months
                    </p>
                  </div>
                </div>
                
                {/* Features Section - Fixed Height */}
                <div className="flex-1 mb-6 min-h-[200px]">
                  <ul className="space-y-2">
                    {(() => {
                      const isExpanded = expandedCards.has(category);
                      const featuresToShow = isExpanded ? plan.features : plan.features.slice(0, 3);
                      
                      return featuresToShow.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm font-medium text-foreground/60">
                          <BadgeCheck strokeWidth={1} size={16} className="text-green-500" />
                          {feature}
                        </li>
                      ));
                    })()}
                  </ul>
                  
                  {plan.features.length > 3 && (
                    <button 
                      onClick={() => toggleExpansion(category)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      {expandedCards.has(category) 
                        ? 'View Less' 
                        : `View ${plan.features.length - 3} More`
                      }
                    </button>
                  )}
                </div>
                
                {/* Button Section */}
                <div className="mt-auto">
                  <Button
                    onClick={handleGetStarted}
                    className={`w-full ${
                      isAllInOne 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-strentor-red hover:bg-strentor-red/90 text-white'
                    }`}
                  >
                    Get Started
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
