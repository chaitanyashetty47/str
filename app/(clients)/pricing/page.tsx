import { getSubscriptionPlans } from "@/actions/subscriptions/get-subscription-plans";
import { Pricing } from "@/components/subscription/Pricing";
import { validateServerRole } from "@/lib/server-role-validation";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function PricingPage() {
  // Validate user authentication and CLIENT role
  // const { user } = await validateServerRole(['CLIENT']);
    

  // Check if user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // If authenticated, redirect to settings page for subscription management
  if (user) {
    redirect("/settings");
  }
  
  // If not authenticated, show public pricing
  const plans = await getSubscriptionPlans();
  return <Pricing plans={plans} />;

  // return (
  //   <div>
  //     This page doesnt exist
  //   </div>
  // )
}
