import Link from "next/link"
import { ArrowLeft, Calendar, User, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import WorkoutSchedule from "@/components/workouts/workout-schedule"
import WorkoutTabs from "@/components/workouts/workout-tabs"
import StatsCards from "@/components/workouts/stats-cards"
import LogTodayButton from "@/components/workouts/log-today-button"
import { getWorkoutPlanDetails } from "@/actions/clientworkout.action"
import { redirect } from "next/navigation"

export default async function WorkoutPlanPage({params}: {params: Promise<{ planId: string }>}) {
  const { planId } = await params
  
  // Get real workout plan data from the server action
  const result = await getWorkoutPlanDetails(planId)
  
  // If result is a Next.js Redirect object returned from encodedRedirect
  if (result && typeof result === 'object' && 'type' in result && result.type === 'redirect') {
    // Return the redirect object to let Next.js handle it
    return result
  }
  
  // Handle other error responses
  if (result.error) {
    throw new Error(result.error)
  }
  
  const plan = result.data

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-6">
        <Link href="/workouts" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workout Plans
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-2">
            <h1 className="text-3xl font-bold mr-3">{plan.name}</h1>
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {plan.category}
            </span>
          </div>
          <p className="text-muted-foreground max-w-3xl mx-auto">{plan.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Duration</h3>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-purple-500 mr-2" />
                <span className="font-medium">{plan.duration_weeks} Weeks</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Trainer</h3>
              <div className="flex items-center">
                <User className="h-5 w-5 text-purple-500 mr-2" />
                <span className="font-medium">{plan.trainer.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Program Dates</h3>
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-purple-500 mr-2" />
                <span className="font-medium">
                  {new Date(plan.start_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}{" "}
                  to{" "}
                  {new Date(plan.end_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Overall Progress</h3>
            <span className="font-medium">{plan.progress}%</span>
          </div>
          <Progress value={plan.progress} className="h-2" />
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Weekly Progress</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {plan.weeks.map((week) => (
              <div
                key={week.week_number}
                className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                  week.status === "completed"
                    ? "bg-green-100 border-green-300 text-green-800"
                    : week.status === "active"
                      ? "bg-purple-100 border-purple-300 text-purple-800"
                      : "bg-gray-100 border-gray-300 text-gray-500"
                }`}
              >
                W{week.week_number}
              </div>
            ))}
          </div>
        </div>

        <WorkoutTabs />

          <WorkoutSchedule workoutDays={plan.workout_days} />

        {/* <div className="mt-8 flex justify-center">
          <LogTodayButton workoutDays={plan.workout_days} />
        </div> */}

        <StatsCards
          programLength={plan.duration_weeks}
          workoutsPerWeek={plan.days_per_week}
          completionRate={plan.completion_rate}
        />
      </div>
    </div>
  )
}

