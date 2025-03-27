"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import WorkoutHistory from "./workout-history"
import { Check } from "lucide-react"

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  weight: string
  previousWeight: string
  previousReps: string
  notes: string
}

interface WorkoutDay {
  number: number
  type: string
  exercises: Exercise[]
}

interface WorkoutData {
  id: string
  name: string
  currentWeek: number
  currentDay: WorkoutDay
}

interface WorkoutLoggerProps {
  workoutData: WorkoutData
  week: number
  day: number
  planId: string
}

export default function WorkoutLogger({ workoutData, week, day, planId }: WorkoutLoggerProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("current")
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, { weight: string; reps: string; notes: string }>>({})

  const handleWeekChange = (value: string) => {
    router.push(`/workouts/logs?planId=${planId}&week=${value}&day=${day}`)
  }

  const handleInputChange = (exerciseId: string, field: "weight" | "reps" | "notes", value: string) => {
    setExerciseLogs((prev) => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] || { weight: "", reps: "", notes: "" }),
        [field]: value,
      },
    }))
  }

  const handleSubmit = () => {
    // Here you would submit the workout logs to your backend
    console.log("Submitting workout:", exerciseLogs)
  }

  return (
    <div>
      <div className="sticky top-0 bg-background z-10 pb-6 border-b">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Logging Workout</h2>
            <p className="text-muted-foreground">
              {workoutData.currentDay.type} - Day {day}
            </p>
          </div>
          <Select value={week.toString()} onValueChange={handleWeekChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 8 }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  Week {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSubmit}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-lg font-semibold"
        >
          <Check className="mr-2 h-5 w-5" /> Complete Workout
        </Button>
      </div>

      <Tabs defaultValue="current" onValueChange={setActiveTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="current">Current Workout</TabsTrigger>
          <TabsTrigger value="history">Workout History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {workoutData.currentDay.exercises.map((exercise) => (
            <div key={exercise.id} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{exercise.name}</h3>
                <div className="text-sm font-medium text-purple-600">
                  {exercise.sets} sets × {exercise.reps}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                  <Input
                    placeholder={`Previous: ${exercise.previousWeight}`}
                    value={exerciseLogs[exercise.id]?.weight || ""}
                    onChange={(e) => handleInputChange(exercise.id, "weight", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Previous: {exercise.previousWeight}. Enter new weight or keep the same.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Reps</label>
                  <Input
                    placeholder={`Previous: ${exercise.previousReps}`}
                    value={exerciseLogs[exercise.id]?.reps || ""}
                    onChange={(e) => handleInputChange(exercise.id, "reps", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Previous: {exercise.previousReps}. Adjust if needed based on your strength today.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <Textarea
                    placeholder="How did this exercise feel? Any improvements?"
                    className="h-[42px]"
                    value={exerciseLogs[exercise.id]?.notes || ""}
                    onChange={(e) => handleInputChange(exercise.id, "notes", e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Take a short rest before moving to the next exercise</p>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="history">
          <WorkoutHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

