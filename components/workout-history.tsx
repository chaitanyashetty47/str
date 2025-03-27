"use client"

import { useState } from "react"
import { CalendarIcon, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Mock data for workout history
const mockHistoryData = [
  {
    date: "Feb 22, 2024",
    workout: "Chest + Triceps",
    exercises: [
      { name: "Bench Press", weight: "82.5kg", reps: "10, 10, 8, 8", notes: "Felt strong today" },
      { name: "Incline Dumbbell Press", weight: "32kg", reps: "12, 10, 10", notes: "" },
    ],
  },
  {
    date: "Feb 21, 2024",
    workout: "Back + Biceps",
    exercises: [
      { name: "Deadlift", weight: "120kg", reps: "8, 8, 8", notes: "Lower back felt tight" },
      { name: "Pull-ups", weight: "BW", reps: "12, 10, 8", notes: "" },
    ],
  },
]

export default function WorkoutHistory() {
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null)
  const [date, setDate] = useState<Date>()

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Workout History</h2>
          <p className="text-sm text-muted-foreground">View and edit your past workouts</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-[240px] justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted">
          <div className="col-span-2 font-medium">Date</div>
          <div className="col-span-2 font-medium">Workout</div>
          <div className="col-span-2 font-medium">Exercise</div>
          <div className="col-span-2 font-medium">Weight</div>
          <div className="col-span-2 font-medium">Reps</div>
          <div className="col-span-1 font-medium">Notes</div>
          <div className="col-span-1 font-medium">Actions</div>
        </div>

        {mockHistoryData.map((entry, index) => (
          <div key={index}>
            {entry.exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="grid grid-cols-12 gap-4 px-4 py-3 border-t">
                {exerciseIndex === 0 && (
                  <>
                    <div className="col-span-2">{entry.date}</div>
                    <div className="col-span-2">{entry.workout}</div>
                  </>
                )}
                {exerciseIndex !== 0 && <div className="col-span-4" />}
                <div className="col-span-2">{exercise.name}</div>
                <div className="col-span-2">{exercise.weight}</div>
                <div className="col-span-2">{exercise.reps}</div>
                <div className="col-span-1 truncate" title={exercise.notes}>
                  {exercise.notes || "-"}
                </div>
                <div className="col-span-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedWorkout({ ...entry, exercise })}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit workout</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Workout - {exercise.name}</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="weight" className="text-right">
                            Weight
                          </Label>
                          <Input id="weight" defaultValue={exercise.weight} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="reps" className="text-right">
                            Reps
                          </Label>
                          <Input id="reps" defaultValue={exercise.reps} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="notes" className="text-right">
                            Notes
                          </Label>
                          <Input id="notes" defaultValue={exercise.notes} className="col-span-3" />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

