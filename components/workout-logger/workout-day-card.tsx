"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle, Circle, Play, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type WorkoutDay } from "@/actions/client-workout/client-weekly-workout.action";
import { WorkoutExerciseCard } from "./workout-exercise-card";
import { isWorkoutDayPastDeadline, getWorkoutDeadlineDate } from "@/utils/date-utils";

interface WorkoutDayCardProps {
  day: WorkoutDay;
  onSaveSet: (
    dayExerciseId: string,
    setNumber: number,
    weightKg: number,
    reps: number,
    rpe?: number
  ) => void;
  isSaving: boolean;
}

export function WorkoutDayCard({ day, onSaveSet, isSaving }: WorkoutDayCardProps) {
  const [expandedExercises, setExpandedExercises] = useState<string[]>([]);

  const dayDate = format(new Date(day.dayDate), "EEE, MMM d");
  const isRestDay = day.exercises.length === 0;
  const isPastDeadline = isWorkoutDayPastDeadline(day.dayDate);
  const deadlineDate = getWorkoutDeadlineDate(day.dayDate);

  const toggleExercise = (exerciseId: string) => {
    setExpandedExercises(prev => 
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  return (
    <TooltipProvider>
      <Card className={`${day.isCompleted ? 'ring-2 ring-green-500' : isPastDeadline ? 'ring-2 ring-red-300' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {day.title}
              </CardTitle>
              {isPastDeadline && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Clock className="h-4 w-4 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Logging deadline passed ({deadlineDate})</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {day.isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400" />
            )}
          </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{dayDate}</span>
            {!isRestDay && (
              <span>{day.completedSets} / {day.totalSets} sets</span>
            )}
          </div>
          
          {!isRestDay && (
            <div className="space-y-1">
              <Progress value={day.progressPercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{day.progressPercentage}% complete</span>
                {day.isCompleted && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Complete
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isRestDay ? (
          <div className="text-center py-8 text-gray-500">
            <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Rest Day</p>
          </div>
        ) : (
          <Accordion type="multiple" value={expandedExercises} className="space-y-2">
            {day.exercises.map((exercise) => (
              <AccordionItem
                key={exercise.dayExerciseId}
                value={exercise.dayExerciseId}
                className="border rounded-lg"
              >
                <AccordionTrigger 
                  className="px-3 py-2 hover:no-underline"
                  onClick={() => toggleExercise(exercise.dayExerciseId)}
                >
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center gap-2">
                      {exercise.isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="font-medium text-left truncate">
                        {exercise.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{exercise.completedSets}/{exercise.totalSets}</span>
                      {exercise.youtubeLink && (
                        <Play className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-3 pb-3">
                  <WorkoutExerciseCard
                    exercise={exercise}
                    onSaveSet={onSaveSet}
                    isSaving={isSaving}
                    isPastDeadline={isPastDeadline}
                    deadlineDate={deadlineDate}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
} 