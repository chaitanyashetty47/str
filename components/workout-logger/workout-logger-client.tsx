"use client";

import { useState, useEffect, useOptimistic, startTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAction } from "@/hooks/useAction";
import { getWeeklyWorkoutDays, type WeeklyWorkoutData } from "@/actions/client-workout/client-weekly-workout.action";
import { saveWorkoutSet } from "@/actions/client-workout/save-workout-set.action";
import { WorkoutDayCard } from "./workout-day-card";
import { format, addWeeks, subWeeks } from "date-fns";
import { toast } from "sonner";

interface WorkoutLoggerClientProps {
  workoutId: string;
  weekNumber: number;
}

type OptimisticAction = {
  type: "SAVE_SET";
  dayExerciseId: string;
  setNumber: number;
  data: {
    weightKg: number;
    reps: number;
    rpe?: number;
  };
};

export function WorkoutLoggerClient({ 
  workoutId, 
  // startDate, 
  // endDate ,
  weekNumber
}: WorkoutLoggerClientProps) {
  const router = useRouter();
  const [workoutData, setWorkoutData] = useState<WeeklyWorkoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalWeeks = workoutData?.totalWeeks || 0;
  // Optimistic updates for immediate UI feedback
  const [optimisticData, setOptimisticData] = useOptimistic(
    workoutData,
    (state: WeeklyWorkoutData | null, action: OptimisticAction) => {
      if (!state || action.type !== "SAVE_SET") return state;

      return {
        ...state,
        days: state.days.map(day => ({
          ...day,
          exercises: day.exercises.map(exercise => {
            if (exercise.dayExerciseId !== action.dayExerciseId) return exercise;

            const updatedSets = exercise.sets.map(set => {
              if (set.setNumber !== action.setNumber) return set;
              
              return {
                ...set,
                loggedWeight: action.data.weightKg,
                loggedReps: action.data.reps,
                loggedRpe: action.data.rpe,
                isCompleted: true,
              };
            });

            const completedSets = updatedSets.filter(set => set.isCompleted).length;
            
            return {
              ...exercise,
              sets: updatedSets,
              completedSets,
              isCompleted: completedSets === exercise.totalSets,
            };
          }),
        })).map(day => {
          // Recalculate day progress
          const totalSets = day.exercises.reduce((sum, ex) => sum + ex.totalSets, 0);
          const completedSets = day.exercises.reduce((sum, ex) => sum + ex.completedSets, 0);
          
          return {
            ...day,
            completedSets,
            totalSets,
            progressPercentage: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
            isCompleted: totalSets > 0 && completedSets === totalSets,
          };
        }),
      };
    }
  );

  // Actions
  const { execute: fetchWorkoutData, isLoading: isFetching } = useAction(getWeeklyWorkoutDays, {
    onSuccess: (data) => {
      setWorkoutData(data);
      setError(null);
    },
    onError: (error) => {
      setError(error);
    },
    onComplete: () => {
      setIsLoading(false);
    },
  });

  const { execute: saveSet, isLoading: isSaving } = useAction(saveWorkoutSet, {
    onSuccess: (data) => {
      // Refetch data to ensure consistency
      fetchWorkoutData({
        workoutId,
        weekNumber,
      });
    },
    onError: (error) => {
      console.error("Failed to save set:", error);
      toast.error("Failed to save set");
    },
  });

  // Load initial data (fetchWorkoutData excluded from deps to avoid infinite loop)
  useEffect(() => {
    fetchWorkoutData({
      workoutId,
      // startDate,
      // endDate,
      weekNumber
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId, weekNumber]);

  // Handle set save with optimistic update
  const handleSaveSet = (
    dayExerciseId: string,
    setNumber: number,
    weightKg: number,
    reps: number,
    rpe?: number
  ) => {
    // Optimistic update
    startTransition(() => {
      setOptimisticData({
        type: "SAVE_SET",
        dayExerciseId,
        setNumber,
        data: { weightKg, reps, rpe },
      });
    });

    // Save to server - no need to pass logDate anymore
    saveSet({
      dayExerciseId,
      setNumber,
      weightKg,
      reps,
      rpe,
      logDate: "", // Keep for backward compatibility, but not used
    });
  };

  // Week navigation
  const navigateWeek = (direction: "prev" | "next") => {
    console.log('Navigation clicked:', direction, 'Current weekNumber:', weekNumber);
    
    const newWeekNumber = direction === "prev" 
      ? weekNumber - 1 
      : weekNumber + 1;

    // if (newWeekNumber < 1 || newWeekNumber > totalWeeks) {
    //   toast.error("Invalid week number");
    //   return;
    // }

    const newUrl = `/workout/${workoutId}?weekNumber=${newWeekNumber}`;
    router.push(newUrl);
    console.log('Navigating to:', newUrl);
    
    // const currentDate = new Date(startDate + 'T12:00:00.000Z'); // Add time to avoid timezone issues
    // console.log('Current date object:', currentDate);
    
    // const newDate = direction === "prev" 
    //   ? subWeeks(currentDate, 1) 
    //   : addWeeks(currentDate, 1);
    
    // console.log('New date object:', newDate);
    
    // const { startDate: newStart, endDate: newEnd } = getWeekRangeSimple(newDate);
    // console.log('New date range:', { newStart, newEnd });
    
    // const newUrl = `/workout/${workoutId}?startDate=${newStart}&endDate=${newEnd}`;
    // console.log('Navigating to:', newUrl);
    
    // router.push(newUrl);
  };

  if (isLoading) {
    return <WorkoutLoggerSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!optimisticData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No workout data found</p>
      </div>
    );
  }

  const weekStartFormatted = format(new Date(workoutData?.startDate || ""), "MMM d");
  const weekEndFormatted = format(new Date(workoutData?.endDate || ""), "MMM d, yyyy");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{optimisticData.planTitle}</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Week {optimisticData.weekNumber}</Badge>
          <span className="text-sm text-gray-600">
            {weekStartFormatted} - {weekEndFormatted}
          </span>
        </div>
      </div>

      {/* Week Progress */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Week Progress</h3>
          <span className="text-sm text-gray-600">
            {optimisticData.totalCompletedSets} / {optimisticData.totalSets} sets
          </span>
        </div>
        <Progress value={optimisticData.weekProgressPercentage} className="h-2" />
        <p className="text-sm text-gray-600 mt-1">
          {optimisticData.weekProgressPercentage}% complete
        </p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigateWeek("prev")}
          disabled={isFetching || weekNumber === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous Week
        </Button>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="font-medium">
            {weekStartFormatted} - {weekEndFormatted}
          </span>
        </div>

        <Button
          variant="outline"
          onClick={() => navigateWeek("next")}
          disabled={isFetching || weekNumber === totalWeeks}
        >
          Next Week
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Workout Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {optimisticData.days.map((day) => (
          <WorkoutDayCard
            key={day.dayId}
            day={day}
            onSaveSet={handleSaveSet}
            isSaving={isSaving}
          />
        ))}
      </div>

      {/* Empty state for days with no exercises */}
      {optimisticData.days.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No workouts scheduled for this week</p>
        </div>
      )}
    </div>
  );
}

function WorkoutLoggerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Progress skeleton */}
      <div className="bg-white rounded-lg border p-4">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-2 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Navigation skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Days skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-4 space-y-4">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-2 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 