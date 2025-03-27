"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Exercise = {
  id: string
  name: string
  sets: number
  reps: number
  notes: string
}

type WorkoutDay = {
  id: string
  day_number: number
  workout_type: string
  exercises: Exercise[]
}

interface LogTodayButtonProps {
  workoutDays: WorkoutDay[]
}

export default function LogTodayButton({ workoutDays }: LogTodayButtonProps) {
  const [open, setOpen] = useState(false)
  // Fix: Check if workoutDays exists and has items before accessing the first element
  const [selectedDay, setSelectedDay] = useState<string>(workoutDays && workoutDays.length > 0 ? workoutDays[0].id : "")
  const [workoutLogs, setWorkoutLogs] = useState<Record<string, { sets: number; reps: number; weight: string }>>({})

  // If workoutDays is empty, render a simple button that doesn't open a dialog
  if (!workoutDays || workoutDays.length === 0) {
    return (
      <button className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-md font-medium w-full max-w-md opacity-50 cursor-not-allowed">
        <Calendar className="h-5 w-5" />
        Log Today's Workout
      </button>
    )
  }

  const handleInputChange = (exerciseId: string, field: "sets" | "reps" | "weight", value: string) => {
    setWorkoutLogs((prev) => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] || { sets: 0, reps: 0, weight: "" }),
        [field]: field === "weight" ? value : Number.parseInt(value) || 0,
      },
    }))
  }

  const handleSubmit = () => {
    // Here you would submit the workout logs to your backend
    console.log("Submitting workout logs:", {
      dayId: selectedDay,
      exercises: workoutLogs,
    })
    setOpen(false)
    // Reset form
    setWorkoutLogs({})
  }

  const selectedWorkoutDay = workoutDays.find((day) => day.id === selectedDay)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-md font-medium w-full max-w-md">
          <Calendar className="h-5 w-5" />
          Log Today's Workout
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Log Today's Workout</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Tabs defaultValue={selectedDay} onValueChange={setSelectedDay}>
            <TabsList className="mb-4">
              {workoutDays.map((day) => (
                <TabsTrigger key={day.id} value={day.id}>
                  Day {day.day_number}: {day.workout_type}
                </TabsTrigger>
              ))}
            </TabsList>

            {workoutDays.map((day) => (
              <TabsContent key={day.id} value={day.id} className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Enter the details of your {day.workout_type} workout below.
                </div>

                {day.exercises.map((exercise) => (
                  <div key={exercise.id} className="border rounded-md p-4">
                    <h4 className="font-medium mb-3">{exercise.name}</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`sets-${exercise.id}`}>Sets</Label>
                        <Input
                          id={`sets-${exercise.id}`}
                          type="number"
                          placeholder={`${exercise.sets}`}
                          value={workoutLogs[exercise.id]?.sets || ""}
                          onChange={(e) => handleInputChange(exercise.id, "sets", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`reps-${exercise.id}`}>Reps</Label>
                        <Input
                          id={`reps-${exercise.id}`}
                          type="number"
                          placeholder={`${exercise.reps}`}
                          value={workoutLogs[exercise.id]?.reps || ""}
                          onChange={(e) => handleInputChange(exercise.id, "reps", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`weight-${exercise.id}`}>Weight (lbs)</Label>
                        <Input
                          id={`weight-${exercise.id}`}
                          type="text"
                          placeholder="0"
                          value={workoutLogs[exercise.id]?.weight || ""}
                          onChange={(e) => handleInputChange(exercise.id, "weight", e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{exercise.notes}</p>
                  </div>
                ))}
              </TabsContent>
            ))}
          </Tabs>

          <Button onClick={handleSubmit} className="w-full mt-6">
            <Plus className="mr-2 h-4 w-4" />
            Save Workout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

