import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getUpcomingWorkouts } from "@/actions/clientworkout.action"
import { Skeleton } from "@/components/ui/skeleton"

function UpcomingWorkoutsLoading() {
  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-1">Upcoming Workouts</h2>
      <p className="text-muted-foreground mb-6">Your scheduled sessions for this week</p>

      <div className="space-y-6">
        {/* Create 3 skeleton items to match the layout in the image */}
        {[1, 2, 3].map((index) => (
          <div key={index} className="flex items-center justify-between border-b pb-6 last:border-0 last:pb-0">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" /> {/* Workout type */}
              <Skeleton className="h-4 w-16" /> {/* Day number */}
            </div>
            <Skeleton className="h-10 w-20" /> {/* Start button */}
          </div>
        ))}
      </div>
    </div>
  )
}

interface WorkoutDay {
  id: string;
  day_number: number;
  workout_type: string;
}

export default async function UpcomingWorkouts({planId, week}: {planId: string, week: number}) {
  const {data: workouts, error} = await getUpcomingWorkouts(planId)

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-1">Upcoming Workouts</h2>
      <p className="text-muted-foreground mb-6">Your scheduled sessions for this week</p>

      {error && <p className="text-red-500">{error.message}</p>}

      <div className="space-y-6">
        {workouts?.map((workout: WorkoutDay) => (
          <div key={workout.id} className="flex items-center justify-between border-b pb-6 last:border-0 last:pb-0">
            <div>
              <p className="font-bold text-lg">{workout.workout_type}</p>
              <p className="text-muted-foreground">
                Day {workout.day_number}
              </p>
            </div>
            
            <Button className="bg-black hover:bg-gray-800 text-white" asChild>
              <Link href={`/workouts/logs?planId=${planId}&week=${week}&day=${workout.day_number}`}>
                Start
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Export the loading component to be used by React Suspense
export { UpcomingWorkoutsLoading }

