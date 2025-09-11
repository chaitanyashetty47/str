"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { GripVertical, MoreHorizontal, Plus, Trash2, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExerciseInPlan } from "@/types/workout-plans-create/editor-state";
import { usePlanDispatch, usePlanMeta, usePlanValidation } from "@/contexts/PlanEditorContext";
import { useClientMaxLifts } from "@/hooks/use-client-max-lifts";
import { IntensityMode } from "@prisma/client";
import { SetRow } from "./set-row";

interface Props {
  exercise: ExerciseInPlan;
  weekNumber: number;
  dayNumber: number;
  dragHandleProps?: Record<string, any>;
}

export function ExerciseContainer({ exercise, weekNumber, dayNumber, dragHandleProps }: Props) {
  const dispatch = usePlanDispatch();
  const { meta } = usePlanMeta();
  const { oneRMMap } = useClientMaxLifts(meta.clientId);
  const oneRMData = oneRMMap[exercise.listExerciseId];
  const oneRM = oneRMData?.maxWeight || undefined;
  const { getExerciseValidationStatus } = usePlanValidation();

  // Get validation status for this exercise
  const validationStatus = getExerciseValidationStatus(exercise);

  return (
    <Card className={cn(
      "border-muted-foreground/20",
      !validationStatus.isValid && "border-destructive/50 bg-destructive/5"
    )}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div {...dragHandleProps}>
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate max-w-xs">
                {exercise.name}
              </span>
              {/* Validation Status Indicator */}
              {!validationStatus.isValid && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                  <span className="text-[10px] text-destructive font-medium">
                    {validationStatus.emptySetNumbers.length} incomplete set{validationStatus.emptySetNumbers.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="w-fit text-[10px] flex items-center gap-1">
                {exercise.bodyPart}
                {meta.intensityMode === IntensityMode.PERCENT && !oneRM && (
                  <span className="text-xs text-destructive flex flex-row flex-nowrap" 
                  > <AlertCircle className="w-3 h-3 text-destructivem mr-1" /> No 1-RM data</span>
                )}
              </Badge>
              {/* Sets Count Badge */}
              <Badge variant="outline" className="text-[10px]">
                {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                dispatch({
                  type: "DELETE_EXERCISE",
                  week: weekNumber,
                  day: dayNumber,
                  exercise: exercise,
                });
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Remove Exercise
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Sets table */}
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
          <span className="col-span-1">Set</span>
          <span className="col-span-3">Weight</span>
          <span className="col-span-2">Reps</span>
          <span className="col-span-2">Rest (s)</span>
          <span className="col-span-4">Notes</span>
        </div>

        {exercise.sets.map((s) => (
          <SetRow
            key={s.setNumber}
            setNumber={s.setNumber}
            weight={s.weight}
            reps={s.reps}
            rest={s.rest}
            notes={s.notes}
            weekNumber={weekNumber}
            dayNumber={dayNumber}
            exerciseUid={exercise.uid}
            oneRM={oneRM}
            intensityMode={meta.intensityMode}
            isRepsBased={exercise.isRepsBased} // NEW: Pass reps-based flag
          />
        ))}

        {/* Exercise Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Exercise Notes
          </label>
          <Textarea
            placeholder="Add notes or instructions for this exercise..."
            value={exercise.instructions || ""}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_EXERCISE_FIELD",
                week: weekNumber,
                day: dayNumber,
                uid: exercise.uid,
                field: "instructions",
                value: e.target.value,
              })
            }
            className="min-h-[80px] text-sm"
          />
        </div>

        {/* Add set button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-strentor-blue"
          onClick={() =>
            dispatch({
              type: "ADD_SET",
              week: weekNumber,
              day: dayNumber,
              exercise: exercise,
            })
          }
        >
          <Plus className="w-4 h-4 mr-1" /> Add Set
        </Button>
      </CardContent>
    </Card>
  );
}