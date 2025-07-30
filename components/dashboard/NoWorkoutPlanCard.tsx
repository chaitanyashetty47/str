import { Dumbbell, AlertCircle, MessageCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function NoWorkoutPlanCard() {
  return (
    <div className="md:col-span-2 border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Workout Plan Progress</h2>

      <Alert className="border-blue-200 bg-blue-50">
        <Dumbbell className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">No Active Workout Plan</AlertTitle>
        <AlertDescription className="text-blue-700 mt-2">
          Currently you got no plans assigned, please contact your trainer for a personalized workout plan based on your goals.
        </AlertDescription>
      </Alert>

      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">Your trainer will create a customized plan for you</span>
        </div>
      </div>
    </div>
  );
} 