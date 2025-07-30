import Link from "next/link";
import { CreditCard, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function NoSubscriptionCard() {
  return (
    <div className="border rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Active Subscriptions</h2>
      </div>

      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">No Active Subscription Found</AlertTitle>
        <AlertDescription className="text-orange-700 mt-2">
          Subscribe to a plan to get access to personalized workout plans and trainer guidance.
        </AlertDescription>
      </Alert>

      <div className="mt-6 flex justify-center">
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/settings" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscribe Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
} 