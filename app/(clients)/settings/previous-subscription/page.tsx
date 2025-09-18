import { PreviousSubscriptionsPage } from '@/components/subscription/previous-subscriptions-page';
import { validateServerRole } from "@/lib/server-role-validation";

export default async function PreviousSubscriptionPage() {
  const { user } = await validateServerRole(['CLIENT']);
  
  return <PreviousSubscriptionsPage userId={user.id} />;
}