import { getClientWorkoutPlanFull } from "@/actions/client-workout/client-full-workout.action";
import WorkoutPageHeader from "@/components/client-workout-page/workout-page-header";
import WorkoutPlanViewer from "@/components/client-workout-page/workout-plan-viewer";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

// Remove force-static since we need dynamic auth checking
// export const revalidate = 86400; // 24 hours static caching  
// export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: "Workout Plan - Strentor",
  description: "View and manage your workout plan. Track your upcoming workout schedules and log your weekly progress.",
  keywords: ["workout plans", "fitness plans", "training programs", "exercise routines", "fitness tracking","workout plan"],
};


export default async function WorkoutPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await validateServerRole(['CLIENT']);

  const { data: workoutPlan, error } = await getClientWorkoutPlanFull({ planId: id });

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!workoutPlan) {
    return <div>Workout plan not found</div>;
  }

  return (
    <div className="space-y-6">
      <WorkoutPageHeader
        planId={workoutPlan.id}
        title={workoutPlan.title}
        description={workoutPlan.description}
        category={workoutPlan.category}
        startDate={workoutPlan.startDate}
        endDate={workoutPlan.endDate}
        durationWeeks={workoutPlan.durationWeeks}
        progress={workoutPlan.progress}
      />
      <WorkoutPlanViewer plan={workoutPlan} />
    </div>
  );
}