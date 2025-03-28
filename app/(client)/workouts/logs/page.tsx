import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import WorkoutLogger from "@/components/workouts/workout-logger"
import { getWorkoutDayForLogging } from "@/actions/clientworkout.action"
// import { redirect } from "next/navigation"

export default async function WorkoutLogPage({
  searchParams,
}: {
  searchParams: Promise<{ planId: string; week: string; day: string }>
}) {
  const { planId, week, day } = await searchParams;
  
  // Fetch workout data using server action
  const result = await getWorkoutDayForLogging(
    planId, 
    parseInt(day), 
    parseInt(week)
  );
  
  // Handle redirect responses
  if (result && typeof result === 'object' && 'type' in result && result.type === 'redirect') {
    return result;
  }
  
  // Handle other errors
  if (result.error) {
    throw new Error(result.error);
  }
  
  const workoutData = result.data;

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <Link
        href={`/workouts/${planId}`}
        className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Workout Plan
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">Log: {workoutData.workoutPlan.name}</h1>
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {workoutData.workoutPlan.category}
          </span>
        </div>
        <p className="text-muted-foreground">{workoutData.workoutPlan.description}</p>
      </div>

      <WorkoutLogger
        workoutData={workoutData}
        week={parseInt(week)}
        day={parseInt(day)}
        planId={planId}
      />
    </div>
  )
}

