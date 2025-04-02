"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Dumbbell, Brain, Sparkles } from "lucide-react"
import { ActiveSubscriptions } from "@/components/subscription/active-subscriptions"
import { SubscribeButton } from "@/components/subscription/subscribe-button"

// Define subscription plan types
type PlanInterval = "monthly" | "quarterly" | "yearly"
type PlanFeature = { name: string; included: boolean }
type PlanCategory = "fitness" | "psychological" | "manifestation"

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    quarterly: number
    yearly: number
  }
  category: PlanCategory
  features: PlanFeature[]
  popular?: boolean
}

// Fitness Plans
const fitnessPlans: SubscriptionPlan[] = [
  {
    id: "silver",
    name: "Silver Plan",
    description: "Essentials",
    price: {
      monthly: 18000,
      quarterly: 48600, // 10% discount
      yearly: 172800, // 20% discount
    },
    category: "fitness",
    features: [
      { name: "12 Online Sessions/Month (3x/week)", included: true },
      { name: "1-Time Nutrition Consultation", included: true },
      { name: "Monthly Progress Report", included: true },
      { name: "Priority Time Slots", included: false },
      { name: "Weekly Progress Tracking", included: false },
    ],
  },
  {
    id: "gold",
    name: "Gold Plan",
    description: "Performance",
    price: {
      monthly: 30000,
      quarterly: 81000, // 10% discount
      yearly: 288000, // 20% discount
    },
    category: "fitness",
    features: [
      { name: "16 Online Sessions/Month (4x/week)", included: true },
      { name: "Full Nutrition Plan + Bi-Weekly Adjustments", included: true },
      { name: "Bi-Weekly Progress Tracking", included: true },
      { name: "Priority Time Slots", included: true },
      { name: "Weekend Access", included: false },
    ],
    popular: true,
  },
  {
    id: "platinum",
    name: "Platinum Plan",
    description: "Elite Transformation",
    price: {
      monthly: 40000,
      quarterly: 108000, // 10% discount
      yearly: 384000, // 20% discount
    },
    category: "fitness",
    features: [
      { name: "20 In-Person Sessions/Month (5x/week)", included: true },
      { name: "Full Nutrition Coaching + Weekly Meal Adjustments", included: true },
      { name: "Weekly Progress Tracking", included: true },
      { name: "Priority Booking + Weekend Access", included: true },
      { name: "1 Free Workshop/Month", included: true },
    ],
  },
  {
    id: "diamond",
    name: "Diamond Plan",
    description: "All-Inclusive VIP",
    price: {
      monthly: 50000,
      quarterly: 135000, // 10% discount
      yearly: 480000, // 20% discount
    },
    category: "fitness",
    features: [
      { name: "25 In-Person Sessions/Month (6x/week, flexible)", included: true },
      { name: "Unlimited Nutrition Coaching + Weekly Check-Ins", included: true },
      { name: "Exclusive Access to Premium Time Slots", included: true },
      { name: "Exclusive Workshops & Webinars", included: true },
      { name: "24/7 WhatsApp Support", included: true },
    ],
  },
  {
    id: "self-paced",
    name: "Self-Paced Plan",
    description: "DIY Training",
    price: {
      monthly: 2000,
      quarterly: 5400, // 10% discount
      yearly: 19200, // 20% discount
    },
    category: "fitness",
    features: [
      { name: "Custom Weekly Workout Plan", included: true },
      { name: "General Nutrition Guide", included: true },
      { name: "₹200 per Virtual Check-In (On-Demand Only)", included: true },
      { name: "No Free Check-Ins", included: true },
      { name: "24/7 Support", included: false },
    ],
  },
]

// Psychological Support Plans
const psychologicalPlans: SubscriptionPlan[] = [
  {
    id: "basic-clarity",
    name: "Basic Clarity Plan",
    description: "Entry-Level Support",
    price: {
      monthly: 6000,
      quarterly: 16200, // 10% discount
      yearly: 57600, // 20% discount
    },
    category: "psychological",
    features: [
      { name: "1 Weekly Check-In (45 mins)", included: true },
      { name: "Personalized Stress Management Plan", included: true },
      { name: "Mindfulness & Breathing Exercises", included: true },
      { name: "On-Demand Check-Ins: ₹1,000 each", included: true },
      { name: "Monthly Emotional Progress Report", included: false },
    ],
  },
  {
    id: "growth-mindset",
    name: "Growth Mindset Plan",
    description: "Deeper Emotional Work",
    price: {
      monthly: 12000,
      quarterly: 32400, // 10% discount
      yearly: 115200, // 20% discount
    },
    category: "psychological",
    features: [
      { name: "1 Weekly Check-In (60 mins)", included: true },
      { name: "Goal-Setting Framework & Cognitive Restructuring", included: true },
      { name: "Monthly Emotional Progress Report", included: true },
      { name: "Stress, Anxiety & Habit-Building Strategies", included: true },
      { name: "On-Demand Check-Ins: ₹1,000 each", included: true },
    ],
    popular: true,
  },
  {
    id: "resilience-mastery",
    name: "Resilience Mastery Plan",
    description: "Complete Mental Fitness",
    price: {
      monthly: 18000,
      quarterly: 48600, // 10% discount
      yearly: 172800, // 20% discount
    },
    category: "psychological",
    features: [
      { name: "1 Weekly Check-In (75 mins)", included: true },
      { name: "Deep Dive into Limiting Beliefs & Emotional Blocks", included: true },
      { name: "Customized Stress, Anxiety & Burnout Management", included: true },
      { name: "Access to Monthly Group Mindfulness Workshops", included: true },
      { name: "On-Demand Check-Ins: ₹1,000 each", included: true },
    ],
  },
]

// Manifestation Plans
const manifestationPlans: SubscriptionPlan[] = [
  {
    id: "vision-starter",
    name: "Vision Starter Plan",
    description: "For Beginners in Manifestation",
    price: {
      monthly: 7000,
      quarterly: 18900, // 10% discount
      yearly: 67200, // 20% discount
    },
    category: "manifestation",
    features: [
      { name: "Weekly Check-In (45 mins)", included: true },
      { name: "Goal Mapping", included: true },
      { name: "Mindset Shifts", included: true },
      { name: "On-Demand Check-Ins: ₹1,000 each", included: true },
      { name: "Energy Alignment Techniques", included: false },
    ],
  },
  {
    id: "abundance-builder",
    name: "Abundance Builder Plan",
    description: "Intermediate Level Guidance",
    price: {
      monthly: 14000,
      quarterly: 37800, // 10% discount
      yearly: 134400, // 20% discount
    },
    category: "manifestation",
    features: [
      { name: "1 Weekly Check-In (60 mins)", included: true },
      { name: "Energy Alignment Techniques", included: true },
      { name: "Visualization Practices", included: true },
      { name: "Monthly Progress Mapping", included: true },
      { name: "On-Demand Check-Ins: ₹1,000 each", included: true },
    ],
    popular: true,
  },
  {
    id: "quantum-manifestation",
    name: "Quantum Manifestation Plan",
    description: "For Advanced Practitioners",
    price: {
      monthly: 20000,
      quarterly: 54000, // 10% discount
      yearly: 192000, // 20% discount
    },
    category: "manifestation",
    features: [
      { name: "1 Weekly Check-In (75 mins)", included: true },
      { name: "Quantum Goal-Setting & Limiting Belief Rewiring", included: true },
      { name: "Weekly Energy Alignment Exercises", included: true },
      { name: "Visualization Practices", included: true },
      { name: "On-Demand Check-Ins: ₹1,000 each", included: true },
    ],
  },
]

// Format price display with commas for thousands
const formatPrice = (price: number) => {
  return "₹" + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Get icon based on category
const getCategoryIcon = (category: PlanCategory) => {
  switch (category) {
    case "fitness":
      return <Dumbbell className="h-5 w-5" />
    case "psychological":
      return <Brain className="h-5 w-5" />
    case "manifestation":
      return <Sparkles className="h-5 w-5" />
  }
}

// Get category color based on category
const getCategoryColor = (category: PlanCategory) => {
  switch (category) {
    case "fitness":
      return "bg-blue-100 text-blue-700"
    case "psychological":
      return "bg-purple-100 text-purple-700"
    case "manifestation":
      return "bg-amber-100 text-amber-700"
  }
}

// Subscription Plan Card component
function PlanCard({ plan, interval }: { plan: SubscriptionPlan; interval: PlanInterval }) {
  const categoryColor = getCategoryColor(plan.category)
  const categoryIcon = getCategoryIcon(plan.category)
  
  // Get price for current interval
  const price = plan.price[interval]
  
  // Get discount text
  const getDiscountText = () => {
    if (interval === "quarterly") return "Save 10%"
    if (interval === "yearly") return "Save 20%"
    return null
  }
  
  const discountText = getDiscountText()

  return (
    <Card className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg" : ""}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-0 right-0 flex justify-center">
          <Badge variant="default" className="px-3 py-1">Most Popular</Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className={`p-1.5 rounded-full ${categoryColor}`}>{categoryIcon}</span>
          <Badge variant="outline" className={categoryColor}>
            {plan.category === "fitness" 
              ? "Fitness" 
              : plan.category === "psychological" 
                ? "Psychological" 
                : "Manifestation"}
          </Badge>
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          <div className="flex flex-wrap items-baseline">
            <span className="text-3xl font-bold mr-1">{formatPrice(price)}</span>
            <span className="text-sm text-muted-foreground">/{interval}</span>
          </div>
          {discountText && (
            <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
              {discountText}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <ul className="space-y-2">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              {feature.included ? (
                <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <X className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
              )}
              <span className={feature.included ? "" : "text-muted-foreground"}>{feature.name}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <SubscribeButton 
          planId={plan.id}
          className="w-full" 
          variant={plan.popular ? "default" : "outline"}
        />
      </CardFooter>
    </Card>
  )
}

export default function SubscriptionsPage() {
  const [interval, setInterval] = useState<PlanInterval>("monthly")
  
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Subscriptions</h1>
        <p className="text-muted-foreground">Choose a subscription plan that works for you</p>
      </div>
      
      {/* Active Subscriptions Section */}
      <ActiveSubscriptions />
      
      {/* Billing Interval Toggle */}
      <div className="flex justify-center my-8">
        <Tabs 
          defaultValue="monthly" 
          value={interval}
          onValueChange={(value: string) => setInterval(value as PlanInterval)}
          className="w-full max-w-md"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Fitness Plans */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <span className={`p-1.5 rounded-full bg-blue-100`}>
            <Dumbbell className="h-5 w-5 text-blue-700" />
          </span>
          <h2 className="text-2xl font-bold">Fitness Plans</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {fitnessPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} interval={interval} />
          ))}
        </div>
      </div>
      
      {/* Psychological Support Plans */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <span className={`p-1.5 rounded-full bg-purple-100`}>
            <Brain className="h-5 w-5 text-purple-700" />
          </span>
          <h2 className="text-2xl font-bold">Psychological Support Plans</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {psychologicalPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} interval={interval} />
          ))}
        </div>
      </div>
      
      {/* Manifestation Plans */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <span className={`p-1.5 rounded-full bg-amber-100`}>
            <Sparkles className="h-5 w-5 text-amber-700" />
          </span>
          <h2 className="text-2xl font-bold">Manifestation Plans</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {manifestationPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} interval={interval} />
          ))}
        </div>
      </div>
    </div>
  )
}
