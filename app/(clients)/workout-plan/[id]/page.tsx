import { getClientWorkoutPlanFull } from "@/actions/client-workout/client-full-workout.action";
import WorkoutPageHeader from "@/components/client-workout-page/workout-page-header";
import WorkoutPlanViewer from "@/components/client-workout-page/workout-plan-viewer";

// Remove force-static since we need dynamic auth checking
// export const revalidate = 86400; // 24 hours static caching  
// export const dynamic = 'force-static';

export default async function WorkoutPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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