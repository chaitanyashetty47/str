"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import WorkoutHistory from "./workout-history"
import { Check, AlertCircle } from "lucide-react"
import { logWorkoutCompletion } from "@/actions/clientworkout.action"
import { toast } from "sonner"

interface WorkoutExercise {
  id: string
  name: string
  programmedSets: number
  programmedReps: number
  programmedWeight: number
  notes: string | null
  youtube_link: string | null
  previousSets: {
    id: string
    set_number: number
    weight: number
    reps: number
  }[] | null
  logId?: string | null // Optional ID of existing log record
}

interface WorkoutDayData {
  id: string
  dayNumber: number
  workoutType: string
  exercises: WorkoutExercise[]
}

interface WorkoutPlanData {
  id: string
  name: string
  description: string | null
  category: string
  durationWeeks: number
}

interface WorkoutData {
  planId: string
  workoutPlan: WorkoutPlanData
  workoutDay: WorkoutDayData
  weekNumber: number
  
  hasPreviousLog: boolean
  previousLogDate: string | null
}

interface WorkoutLoggerProps {
  workoutData: WorkoutData
  week: number
  day: number
  planId: string
}

interface SetLog {
  weight: string
  reps: string
  isComplete: boolean
  setId?: string // Optional ID for existing set records
}

export default function WorkoutLogger({ workoutData, week, day, planId }: WorkoutLoggerProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("current")
  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  
  // Initialize exercise logs with empty sets based on programmed sets
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, SetLog[]>>({})
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({})
  
  // Initialize logs for each exercise on component mount
  useEffect(() => {
    const initialLogs: Record<string, SetLog[]> = {};
    const initialNotes: Record<string, string> = {};
    
    workoutData.workoutDay.exercises.forEach(exercise => {
      // Check if we have previous logs for this exercise
      if (exercise.previousSets && exercise.previousSets.length > 0) {
        // Pre-populate with previous data
        initialLogs[exercise.id] = exercise.previousSets.map(set => ({
          weight: set.weight.toString(),
          reps: set.reps.toString(),
          isComplete: true,
          setId: set.id // Store the set ID for updates
        }));
      } else {
        // Create empty logs for new exercises
        initialLogs[exercise.id] = Array(exercise.programmedSets).fill(null).map(() => ({
          weight: "",
          reps: "",
          isComplete: false
        }));
      }
      initialNotes[exercise.id] = "";
    });
    
    setExerciseLogs(initialLogs);
    setExerciseNotes(initialNotes);
  }, [workoutData]);

  const handleWeekChange = (value: string) => {
    router.push(`/workouts/logs?planId=${planId}&week=${value}&day=${day}`)
  }

  const handleSetInputChange = (exerciseId: string, setIndex: number, field: "weight" | "reps", value: string) => {
    setExerciseLogs(prev => {
      const updatedSets = [...prev[exerciseId]];
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [field]: value,
        isComplete: value.trim() !== "" && 
          (field === "weight" ? updatedSets[setIndex].reps.trim() !== "" : updatedSets[setIndex].weight.trim() !== "")
      };
      return {
        ...prev,
        [exerciseId]: updatedSets
      };
    });
    
    // Clear validation error when user types
    if (validationError) {
      setValidationError(null);
    }
  }

  const handleNoteChange = (exerciseId: string, note: string) => {
    setExerciseNotes(prev => ({
      ...prev,
      [exerciseId]: note
    }));
  }

  const validateWorkout = (): boolean => {
    // Check if all exercises have complete set logs
    for (const exercise of workoutData.workoutDay.exercises) {
      const sets = exerciseLogs[exercise.id];
      
      if (!sets || sets.length === 0) {
        setValidationError(`Please log all sets for ${exercise.name}`);
        return false;
      }
      
      for (let i = 0; i < sets.length; i++) {
        const set = sets[i];
        if (!set.weight || !set.reps) {
          setValidationError(`Please complete Set ${i + 1} for ${exercise.name}`);
          return false;
        }
      }
    }
    
    return true;
  }

  const handleSubmit = async () => {
    if (!validateWorkout()) {
      return;
    }
    
    setSubmitting(true);
    setValidationError(null);
    
    try {
      // Format exercises data for submission
      const formattedExercises = workoutData.workoutDay.exercises.map(exercise => ({
        exerciseId: exercise.id,
        logId: exercise.logId || undefined, // Include log ID if this is an update
        sets: exerciseLogs[exercise.id].map((set, index) => ({
          setNumber: index + 1,
          weight: parseFloat(set.weight),
          reps: parseInt(set.reps),
          setId: set.setId // Include set ID if this is an update
        }))
      }));
      
      const result = await logWorkoutCompletion(
        planId,
        workoutData.workoutDay.id,
        week,
        formattedExercises
      );
      
      if (result.success) {
        toast.success(
          workoutData.workoutDay.exercises.some(ex => ex.logId) 
            ? "Workout updated successfully!" 
            : "Workout logged successfully!"
        );
        // Redirect back to workout plan page
        router.push(`/workouts/${planId}`);
      } else {
        setValidationError(result.error || "Failed to log workout");
      }
    } catch (error) {
      console.error("Error submitting workout:", error);
      setValidationError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  const isFormComplete = (): boolean => {
    for (const exercise of workoutData.workoutDay.exercises) {
      const sets = exerciseLogs[exercise.id] || [];
      if (sets.some(set => !set.isComplete)) {
        return false;
      }
    }
    return true;
  }

  return (
    <div>
      <div className="sticky top-0 bg-background z-10 pb-6 border-b">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Logging Workout</h2>
            <p className="text-muted-foreground">
              {workoutData.workoutDay.workoutType} - Day {day}
            </p>
          </div>
          <Select value={week.toString()} onValueChange={handleWeekChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: workoutData.workoutPlan.durationWeeks }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  Week {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {validationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSubmit}
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700 text-lg font-semibold"
          disabled={submitting || !isFormComplete()}
        >
          <Check className="mr-2 h-5 w-5" /> {submitting ? "Saving..." : "Complete Workout"}
        </Button>
      </div>

      <Tabs defaultValue="current" onValueChange={setActiveTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="current">Current Workout</TabsTrigger>
          {/* <TabsTrigger value="history">Workout History</TabsTrigger> */}
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {workoutData.workoutDay.exercises.map((exercise, exerciseIndex) => (
              <AccordionItem 
                key={exercise.id} 
                value={exercise.id}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex justify-between items-center w-full pr-4">
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">{exercise.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-purple-600">
                        {exercise.programmedSets} sets × {exercise.programmedReps} reps
                      </span>
                      <span className="text-xs rounded-full bg-gray-100 px-2 py-1">
                        {exerciseLogs[exercise.id]?.filter(set => set.isComplete).length || 0}/{exercise.programmedSets} sets
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-6 pb-4">
                  {exercise.notes && (
                    <div className="mb-4 text-sm text-muted-foreground p-3 bg-gray-50 rounded-md">
                      <strong>Trainer Notes:</strong> {exercise.notes}
                    </div>
                  )}
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Set</TableHead>
                        <TableHead>Weight (kg)</TableHead>
                        <TableHead>Reps</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: exercise.programmedSets }).map((_, setIndex) => (
                        <TableRow key={setIndex}>
                          <TableCell className="font-medium">Set {setIndex + 1}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder={`${exercise.programmedWeight || ''}`}
                              value={exerciseLogs[exercise.id]?.[setIndex]?.weight || ""}
                              onChange={(e) => handleSetInputChange(exercise.id, setIndex, "weight", e.target.value)}
                              className="max-w-[120px]"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              placeholder={`${exercise.programmedReps || ''}`}
                              value={exerciseLogs[exercise.id]?.[setIndex]?.reps || ""}
                              onChange={(e) => handleSetInputChange(exercise.id, setIndex, "reps", e.target.value)}
                              className="max-w-[120px]"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <Textarea
                      placeholder="How did this exercise feel? Any improvements?"
                      value={exerciseNotes[exercise.id] || ""}
                      onChange={(e) => handleNoteChange(exercise.id, e.target.value)}
                    />
                  </div>
                  
                  {exerciseIndex < workoutData.workoutDay.exercises.length - 1 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Take a short rest before moving to the next exercise</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* <TabsContent value="history">
          <WorkoutHistory />
        </TabsContent> */}
      </Tabs>
    </div>
  )
}

