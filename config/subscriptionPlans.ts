import { SubscriptionPlan } from "@/types/subscription";

// Temporary static plans; replace with real DB fetch later.
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "fitness_q",
    name: "Fitness Quarterly",
    category: "FITNESS",
    plan_type: "ONLINE",
    price: 21000,
    features: [
      { name: "Everything in Fitness Quarterly", included: true },
      { name: "3-month discounted billing", included: true },
    ],
    razorpay_plan_id: "plan_Qpm6Y0UaT0Cu", // placeholder
    billing_cycle: 3,
  },
  {
    id: "fitness_sa",
    name: "Fitness Semi-Annual",
    category: "FITNESS",
    plan_type: "ONLINE",
    price: 110000,
    features: [
      { name: "Everything in Fitness Semi-Annual", included: true },
      { name: "6-month discounted billing", included: true },
    ],
    razorpay_plan_id: "plan_Qpm1PvU1aVDX8", // placeholder
    billing_cycle: 6,
  },
  {
    id: "fitness_a",
    name: "Fitness Annual",
    category: "FITNESS",
    plan_type: "ONLINE",
    price: 210000,
    features: [
      { name: "Everything in Fitness Annual", included: true },
      { name: "12-month discounted billing", included: true },
    ],
    razorpay_plan_id: "plan_Qpm6Y0UaT0Cu", // placeholder
    billing_cycle: 12,
  },

  {
    id: "psychology_q",
    name: "Psychological Quarterly",
    category: "PSYCHOLOGY",
    plan_type: "ONLINE",
    price: 67500,
    features: [
      { name: "Kickstart Emotional Mapping Session", included: true },
      { name: "Weekly Therapy / Coaching Call", included: true },
    ],
    razorpay_plan_id: "plan_QpnBDlB7mqLivd", // placeholder
    billing_cycle: 3,
  },
  {
    id: "psychology_sa",
    name: "Psychological Semi-Annual",
    category: "PSYCHOLOGY",
    plan_type: "ONLINE",
    price: 120000,
    features: [
      { name: "Everything in Psychological Semi-Annual", included: true },
      { name: "6-month discounted billing", included: true },
    ],
    razorpay_plan_id: "plan_QpNNZQcIOwW9", // placeholder
    billing_cycle: 6,
  },
  {
    id: "psychology_a",
    name: "Psychological Annual",
    category: "PSYCHOLOGY",
    plan_type: "ONLINE",
    price: 210000,
    features: [
      { name: "Everything in Psychological Annual", included: true },
      { name: "12-month discounted billing", included: true },
    ],
    razorpay_plan_id: "plan_QpmnMq0Ng81hv", // placeholder
    billing_cycle: 12,
  },

  {
    id: "manifestation_q",
    name: "Manifestation Quarterly",
    category: "MANIFESTATION",
    plan_type: "ONLINE",
    price: 67500,
    features: [
      { name: "Kickstart 1-1 Alignment Mapping", included: true },
      { name: "Weekly Quantum & Action Coaching", included: true },
    ],
    razorpay_plan_id: "plan_QnNI8PJeaVcekC", // placeholder
    billing_cycle: 3,
  },
  {
    id: "manifestation_sa",
    name: "Manifestation Semi-Annual",
    category: "MANIFESTATION",
    plan_type: "ONLINE",
    price: 120000,
    features: [
      { name: "Everything in Manifestation Semi-Annual", included: true },
      { name: "6-month discounted billing", included: true },
    ],
    razorpay_plan_id: "plan_QpnGp0507VPu8", // placeholder
    billing_cycle: 6,
  },
  {
    id: "manifestation_a",
    name: "Manifestation Annual",
    category: "MANIFESTATION",
    plan_type: "ONLINE",
    price: 210000,
    features: [
      { name: "Everything in Manifestation Annual", included: true },
      { name: "12-month discounted billing", included: true },
    ],
    razorpay_plan_id: "plan_QpnYkH59Cqu7x", // placeholder
    billing_cycle: 12,
  },

  {
    id: "aio_q",
    name: "All-In-One Quarterly",
    category: "ALL_IN_ONE",
    plan_type: "ONLINE",
    price: 202500,
    features: [
      { name: "Kickstart Deep-Dive with 3 Coaches", included: true },
      { name: "Monthly 1:1 Strategy & Evaluation", included: true },
    ],
    razorpay_plan_id: "plan_Qpn1PYRkSnVS6F", // placeholder
    billing_cycle: 3,
  },
  {
    id: "aio_sa",
    name: "All-In-One Semi-Annual",
    category: "ALL_IN_ONE",
    plan_type: "ONLINE",
    price: 336000,
    features: [
      { name: "Everything in All-In-One Semi-Annual", included: true },
      { name: "6-month discounted billing", included: true },
    ],
    razorpay_plan_id: "plan_QpnWMvS0Uljx8", // placeholder
    billing_cycle: 6,
  },
  {
    id: "aio_a",
    name: "All-In-One Annual",
    category: "ALL_IN_ONE",
    plan_type: "ONLINE",
    price: 630000,
    features: [
      { name: "Everything in All-In-One Annual", included: true },
      { name: "12-month discounted billing", included: true },
    ],
    razorpay_plan_id: "plan_QpnNBl8mqivid", // placeholder
    billing_cycle: 12,
  },
]; 