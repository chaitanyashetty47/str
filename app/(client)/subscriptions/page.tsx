import { getSubscriptionPlans } from "@/actions/subscriptionnew.action";
import { Pricing } from "@/components/subscription/Pricing";
export default async function SubscriptionPage() {
  const subscriptionData = await getSubscriptionPlans();
  return (
    <Pricing plans={subscriptionData} />
  );
}