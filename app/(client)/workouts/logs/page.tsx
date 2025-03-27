import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import WorkoutLogger from "@/components/workouts/workout-logger"

// This would normally come from your API/database
const mockWorkoutData = {
  id: "1",
  name: "Strength Training Fundamentals",
  description: "Track your daily workouts and monitor your progress over time",
  category: "Strength",
  currentWeek: 1,
  currentDay: {
    number: 1,
    type: "Lower Body Focus",
    exercises: [
      {
        id: "ex1",
        name: "Barbell Squat",
        sets: 4,
        reps: "8-10",
        weight: "150 lbs",
        previousWeight: "150 lbs",
        previousReps: "8-10",
        notes: "Focus on depth and keeping chest up",
      },
      {
        id: "ex2",
        name: "Romanian Deadlift",
        sets: 3,
        reps: "10-12",
        weight: "135 lbs",
        previousWeight: "135 lbs",
        previousReps: "10-12",
        notes: "Feel the hamstring stretch",
      },
      {
        id: "ex3",
        name: "Walking Lunges",
        sets: 3,
        reps: "12 each leg",
        weight: "30 lbs dumbbells",
        previousWeight: "30 lbs dumbbells",
        previousReps: "12 each leg",
        notes: "Take full steps",
      },
      {
        id: "ex4",
        name: "Leg Press",
        sets: 3,
        reps: "12-15",
        weight: "270 lbs",
        previousWeight: "270 lbs",
        previousReps: "12-15",
        notes: "Don't lock out knees",
      },
    ],
  },
}

export default async function WorkoutLogPage({
  searchParams,
}: {
  searchParams: Promise<{ planId: string; week: string; day: string }>
}) {
  // In a real app, you would fetch this data based on the searchParams
  const { planId, week, day } = await searchParams;
  const workoutData = mockWorkoutData

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
          <h1 className="text-2xl font-bold">Log: {workoutData.name}</h1>
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {workoutData.category}
          </span>
        </div>
        <p className="text-muted-foreground">{workoutData.description}</p>
      </div>

      <WorkoutLogger
        workoutData={workoutData}
        week={Number.parseInt(week)}
        day={Number.parseInt(day)}
        planId={planId}
      />
    </div>
  )
}

