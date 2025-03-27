"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"

interface ExerciseLogButtonProps {
  exerciseId: string
  exerciseName: string
  defaultSets: number
  defaultReps: number
}

export default function ExerciseLogButton({
  exerciseId,
  exerciseName,
  defaultSets,
  defaultReps,
}: ExerciseLogButtonProps) {
  const [open, setOpen] = useState(false)
  const [sets, setSets] = useState(defaultSets)
  const [reps, setReps] = useState(defaultReps)
  const [weight, setWeight] = useState("")

  const handleSubmit = () => {
    // Here you would submit the exercise log to your backend
    console.log("Logging exercise:", {
      exerciseId,
      exerciseName,
      sets,
      reps,
      weight: weight ? Number.parseFloat(weight) : 0,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-sm text-purple-600 font-medium hover:text-purple-800">Log Exercise</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Exercise: {exerciseName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                value={sets}
                onChange={(e) => setSets(Number.parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(Number.parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="text"
                placeholder="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Save Exercise
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

