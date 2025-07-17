"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExerciseInPlan } from "@/types/workout-plans-create/editor-state";
import { ExerciseContainer } from "./exercise-container";

interface Props {
  exercise: ExerciseInPlan;
  weekNumber: number;
  dayNumber: number;
}

export function SortableExercise({ exercise, weekNumber, dayNumber }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: exercise.uid,
    data: {
      type: 'exercise',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseContainer 
        exercise={exercise} 
        weekNumber={weekNumber} 
        dayNumber={dayNumber}
        dragHandleProps={{...attributes, ...listeners}}
      />
    </div>
  );
} 