import { getTrainerClientWorkoutPlanFull } from "@/actions/trainer-clients/get-trainer-client-workout-plan-summary.action";
import WeekColumnSelection from "@/components/workout-summary/WeekColumnSelection";
// import PRDebugPanel from "@/components/workout-summary/PRDebugPanel";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workout Plan Progress - Strentor",
  description: "Track client progress and analyze workout performance. View detailed progress reports, personal records, and training analytics.",
  keywords: ["workout progress", "client progress", "training analytics", "progress tracking", "personal records", "trainer tools"],
};

export default async function TrainerWorkoutPlanSummaryPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Validate user authentication and FITNESS_TRAINER/FITNESS_TRAINER_ADMIN role
  const { user } = await validateServerRole(['FITNESS_TRAINER', 'FITNESS_TRAINER_ADMIN']);
  
  const { id: planId } = await params;
  
  // Fetch the workout plan with trainer authorization
  const { data: workoutPlan, error } = await getTrainerClientWorkoutPlanFull({ 
    planId
  });

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
      {/* Page Header with Client Information */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{workoutPlan.title}</h1>
            <p className="text-muted-foreground mt-2">
              {workoutPlan.description || "Track your client's progress and analyze their performance"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-muted-foreground">Client</div>
            <div className="text-lg font-semibold">{workoutPlan.client.name}</div>
            <div className="text-sm text-muted-foreground">{workoutPlan.client.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Category: {workoutPlan.category}</span>
          <span>•</span>
          <span>Duration: {workoutPlan.durationWeeks} weeks</span>
          <span>•</span>
          <span>Progress: {Math.round(workoutPlan.progress.progressPercentage)}%</span>
          <span>•</span>
          <span>Current Week: {workoutPlan.progress.currentWeek}</span>
        </div>
      </div>

      {/* Analytics Section - Same components as client view */}
      <WeekColumnSelection 
        totalWeeks={workoutPlan.durationWeeks} 
        planId={workoutPlan.id}
      />

      {/* Debug Panel - Same as client view */}
      {/* <PRDebugPanel planId={workoutPlan.id} /> */}
    </div>
  );
}