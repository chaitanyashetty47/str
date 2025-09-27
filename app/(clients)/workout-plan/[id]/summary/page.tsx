import { getClientWorkoutPlanFull } from "@/actions/client-workout/client-full-workout.action";
import WeekColumnSelection from "@/components/workout-summary/WeekColumnSelection";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";
// import PRDebugPanel from "@/components/workout-summary/PRDebugPanel";

export const metadata: Metadata = {
  title: "Workout Plan Summary - Strentor",
  description: "View and manage your workout plan summary. Track your weekly and overall summary of your workout plan.",
  keywords: ["workout plans", "fitness plans", "training programs", "exercise routines", "fitness tracking","fitness plan summary","workout plan summary"],
};

export default async function WorkoutPlanSummaryPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const { user } = await validateServerRole(['CLIENT']);
  // Fetch the workout plan to get the duration
  const { data: workoutPlan, error } = await getClientWorkoutPlanFull({ planId: id });

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          Error loading workout plan: {error}
        </div>
      </div>
    );
  }

  if (!workoutPlan) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-muted-foreground">
          Workout plan not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight">{workoutPlan.title}</h1>
        <p className="text-muted-foreground mt-2">
          {workoutPlan.description || "Track your progress and analyze your performance"}
        </p>
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span>Category: {workoutPlan.category}</span>
          <span>•</span>
          <span>Duration: {workoutPlan.durationWeeks} weeks</span>
          <span>•</span>
          <span>Progress: {Math.round(workoutPlan.progress.progressPercentage)}%</span>
        </div>
      </div>

      {/* Analytics Section */}
      <WeekColumnSelection 
        totalWeeks={workoutPlan.durationWeeks} 
        planId={workoutPlan.id}
      />

      {/* Temporary Debug Panel - Remove after debugging */}
      {/* <PRDebugPanel planId={workoutPlan.id} /> */}
    </div>
  );
}