"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Dumbbell, Brain, Sparkles } from "lucide-react"
import { ActiveSubscriptions } from "@/components/subscription/active-subscriptions"
import { SubscribeButton } from "@/components/subscription/subscribe-button"
import { createClient } from "@/utils/supabase/client"
import { Tables } from "@/utils/supabase/types"
import { Database } from "@/utils/supabase/types"

// Define subscription plan types
type PlanInterval = "monthly" | "quarterly" | "yearly"
type PlanCategory = "fitness" | "psychological" | "manifestation"
type PlanType = "online" | "in-person" | "self-paced"

interface SubscriptionPlan {
  id: string
  name: string
  category: PlanCategory
  plan_type: PlanType | null
  price: number
  features: { name: string; included: boolean }[]
  razorpay_plan_id: string | null
  popular?: boolean
}

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

// Map database category to UI category
const mapCategory = (dbCategory: string): PlanCategory => {
  if (dbCategory === "fitness") return "fitness"
  if (dbCategory === "psychology") return "psychological"
  return "manifestation"
}

// Subscription Plan Card component
function PlanCard({ 
  plan, 
  interval 
}: { 
  plan: SubscriptionPlan; 
  interval: PlanInterval 
}) {
  const categoryColor = getCategoryColor(plan.category)
  const categoryIcon = getCategoryIcon(plan.category)
  
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
        <CardDescription>{plan.plan_type}</CardDescription>
        <div className="mt-4">
          <div className="flex flex-wrap items-baseline">
            <span className="text-3xl font-bold mr-1">{formatPrice(plan.price)}</span>
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
          planId={plan.razorpay_plan_id || ""} 
          className="w-full" 
          variant={plan.popular ? "default" : "outline"}
        />
      </CardFooter>
    </Card>
  )
}

export default function SubscriptionsPage() {
  const [interval, setInterval] = useState<PlanInterval>("monthly")
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchPlans() {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
      
      if (error) {
        console.error('Error fetching plans:', error)
        setLoading(false)
        return
      }
      
      // Transform the data to match our component needs
      const transformedPlans = data.map((plan: Database['public']['Tables']['subscription_plans']['Row']) => {
        // Parse features from JSON string
        let features: { name: string; included: boolean }[] = []
        
        try {
          if (plan.features) {
            // Extract feature names from the features array
            if (Array.isArray(plan.features)) {
              features = (plan.features as any[]).map(feature => ({
                name: feature.name || '',
                included: true
              }))
            }
          }
        } catch (e) {
          console.error('Error parsing features', e)
        }
        
        // Add some popular flags based on price or other criteria
        let popular = false
        if (
          (plan.category === 'fitness' && plan.name.includes('Gold')) ||
          (plan.category === 'psychology' && plan.name.includes('Growth')) ||
          (plan.category === 'manifestation' && plan.name.includes('Abundance'))
        ) {
          popular = true
        }
        
        return {
          id: plan.id,
          name: plan.name,
          category: mapCategory(plan.category),
          plan_type: plan.plan_type,
          price: plan.price,
          features: features,
          razorpay_plan_id: plan.razorpay_plan_id,
          popular
        }
      })
      
      setPlans(transformedPlans)
      setLoading(false)
    }
    
    fetchPlans()
  }, [])
  
  // Filter plans by category
  const fitnessPlans = plans.filter(plan => plan.category === 'fitness')
  const psychologicalPlans = plans.filter(plan => plan.category === 'psychological')
  const manifestationPlans = plans.filter(plan => plan.category === 'manifestation')
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading plans...</div>
  }
  
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
      {fitnessPlans.length > 0 && (
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
      )}
      
      {/* Psychological Support Plans */}
      {psychologicalPlans.length > 0 && (
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
      )}
      
      {/* Manifestation Plans */}
      {manifestationPlans.length > 0 && (
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
      )}
    </div>
  )
}
