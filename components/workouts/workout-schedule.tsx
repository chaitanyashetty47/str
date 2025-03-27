"use client"

import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { ClipboardList } from "lucide-react"

type Exercise = {
  id: string
  name: string
  sets: number
  reps: number
  // weight: string
  notes: string
}

type WorkoutDay = {
  id: string
  day_number: number
  workout_type: string
  exercises: Exercise[]
}

interface WorkoutScheduleProps {
  workoutDays: WorkoutDay[]
  planId?: string
  week?: number
}

export default function WorkoutSchedule({ workoutDays, planId, week = 1 }: WorkoutScheduleProps) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Workout Schedule</h2>
        <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {workoutDays.length} Days/Week
        </span>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {workoutDays.map((day) => (
          <AccordionItem key={day.id} value={day.id} className="border rounded-lg mb-4">
            <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>div]:bg-muted">
              <div className="flex items-center w-full px-2 py-1 rounded-md">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center mr-4 text-sm font-medium">
                  {day.day_number}
                </div>
                <div className="text-left">
                  <h3 className="font-medium">{day.workout_type}</h3>
                  <p className="text-sm text-muted-foreground">{day.exercises.length} exercises</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <div className="mt-2 mb-4">
                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted rounded-t-lg">
                  <div className="col-span-3 font-medium">Exercise</div>
                  <div className="col-span-2 font-medium">Sets x Reps</div>
                  <div className="col-span-2 font-medium">Weight</div>
                  <div className="col-span-5 font-medium">Trainer's Notes</div>
                </div>
                {day.exercises.map((exercise) => (
                  <div key={exercise.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b last:border-b-0">
                    <div className="col-span-3">{exercise.name}</div>
                    <div className="col-span-2">
                      {exercise.sets} x {exercise.reps}
                    </div>
                    {/* <div className="col-span-2">{exercise.weight}</div> */}
                    <div className="col-span-5 text-muted-foreground">{exercise.notes}</div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4">
                <Link href={`/workouts/logs?planId=${planId}&week=${week}&day=${day.day_number}`} className="w-full">
                  <Button className="w-full">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Log This Workout
                  </Button>
                </Link>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

