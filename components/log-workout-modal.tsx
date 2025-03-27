"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Plus } from "lucide-react"

type Exercise = {
  id: string
  name: string
  sets: number
  reps: number
}

interface LogWorkoutModalProps {
  exercises: Exercise[]
  dayNumber: number
  workoutType: string
}

export default function LogWorkoutModal({ exercises = [], dayNumber, workoutType }: LogWorkoutModalProps) {
  const [open, setOpen] = useState(false)
  const [workoutLogs, setWorkoutLogs] = useState<Record<string, { sets: number; reps: number; weight: string }>>({})

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
    console.log("Submitting workout logs:", workoutLogs)
    setOpen(false)
    // Reset form
    setWorkoutLogs({})
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Calendar className="mr-2 h-4 w-4" />
          Log Workout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Log Workout - Day {dayNumber}: {workoutType}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="text-sm text-muted-foreground mb-4">Enter the details of your completed workout below.</div>

          {exercises && exercises.length > 0 ? (
            exercises.map((exercise) => (
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
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">No exercises found for this workout.</div>
          )}

          <Button onClick={handleSubmit} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Save Workout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

