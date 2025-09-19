import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getUpcomingWorkouts } from "@/actions/client-workout/client-workout.action"
import { Skeleton } from "@/components/ui/skeleton"
import { WorkoutDayOutput } from "@/actions/client-workout/client-workout.action"

function UpcomingWorkoutsLoading() {
  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-1">Upcoming Workouts</h2>
      <p className="text-muted-foreground mb-6">Your scheduled sessions for this week</p>

      {/* Horizontal Scrollable Skeleton */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        <div className="flex items-center gap-4 min-w-max">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center space-y-2">
                <Skeleton className="h-4 w-20 md:h-5 md:w-24" /> {/* Workout type */}
                <Skeleton className="h-3 w-12 md:h-4 md:w-14" /> {/* Day number */}
              </div>
              {index < 5 && (
                <div className="text-muted-foreground text-lg">•</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Single Start Current Week Link Skeleton */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-center">
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    </div>
  )
}

// interface WorkoutDay {
//   id: string;
//   dayNumber: number;
//   title: string;
// }

export default async function UpcomingWorkouts({planId, week}: {planId: string, week: number}) {
  const { data: workouts, error } = await getUpcomingWorkouts({ planId })

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-1">Upcoming Workouts</h2>
      <p className="text-muted-foreground mb-6">Your scheduled sessions for this week</p>

      {error && <p className="text-red-500">{error}</p>}

      {/* Horizontal Scrollable Workout List */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        <div className="flex items-center gap-4 min-w-max">
          {workouts?.map((workout: WorkoutDayOutput, index) => (
            <div key={workout.id} className="flex items-center gap-4 flex-shrink-0">
              <div className="text-center">
                <p className="font-bold text-sm md:text-base">{workout.title}</p>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Day {workout.dayNumber}
                </p>
              </div>
              {index < workouts.length - 1 && (
                <div className="text-muted-foreground text-lg">•</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Single Start Current Week Link */}
      <div className="mt-6 pt-4 border-t">
        <Link 
          href={`/workout-plan/${planId}`}
          className="text-strentor-red hover:text-strentor-red/80 font-medium flex items-center justify-center gap-2 transition-colors"
        >
          Start Current Week →
        </Link>
      </div>
    </div>
  )
}

// Export the loading component to be used by React Suspense
export { UpcomingWorkoutsLoading }

