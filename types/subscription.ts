// SubscriptionPlan.ts
export interface SubscriptionPlan {
  id: string;
  name: string;
  category: string;
  plan_type: "ONLINE" | "IN_PERSON" | "SELF_PACED";
  price: number;
  features: { name: string; included: boolean }[];
  razorpay_plan_id: string;
  billing_cycle: 3 | 6 | 12;
}