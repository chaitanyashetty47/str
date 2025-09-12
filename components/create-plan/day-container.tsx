"use client"

import { usePlanState } from "@/contexts/PlanEditorContext";
import { usePlanDispatch } from "@/contexts/PlanEditorContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { ExerciseDrawer } from "./exercise-drawer";
import { v4 as uuidv4 } from "uuid";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableExercise } from "./sortable-exercise";

export function DayContainer({weekNumber, dayNumber}: {weekNumber: number, dayNumber: number}) {
  const { meta, weeks, selectedWeek, selectedDay } = usePlanState();
  const dispatch = usePlanDispatch();

  const currentTitle = weeks[weekNumber - 1].days[dayNumber - 1].title;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Only start drag if it's initiated from a handle
    // if (!active.data.current?.sortable && !active.data.current?.handle) {
    //   event.preventDefault();
    // }
  };

  return (
    <Card 
      id={`week-${weekNumber}-day-${dayNumber}`}
      className="rounded-lg border border-muted-foreground/10 shadow-sm scroll-mt-6"
    >
      <CardHeader className="py-6 px-6">
        <CardTitle className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-gray-900">Day {dayNumber}</span>
            <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-100 text-gray-600">
              Week {weekNumber}
            </Badge>
          </div>
          <Input
            type="text"
            value={currentTitle}
            onChange={(e) =>
              dispatch({ type: "RENAME_DAY", week: weekNumber, day: dayNumber, newName: e.target.value })
            }
            placeholder="Day title"
            className="w-full max-w-md h-10 text-center text-base font-medium border-gray-200 focus:border-blue-500"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={({ active, over }) => {
            if (!over || active.id === over.id) return;
            dispatch({
              type: "REORDER_EXERCISE",
              week: weekNumber,
              day: dayNumber,
              activeUid: String(active.id),
              overUid: String(over.id),
            });
          }}
        >
          <SortableContext
            items={weeks[weekNumber - 1].days[dayNumber - 1].exercises.map((e) => e.uid)}
            strategy={verticalListSortingStrategy}
          >
            {weeks[weekNumber - 1].days[dayNumber - 1].exercises.map((ex) => (
              <SortableExercise
                key={ex.uid}
                exercise={ex}
                weekNumber={weekNumber}
                dayNumber={dayNumber}
              />
            ))}
          </SortableContext>
        </DndContext>

        <ExerciseDrawer
          trigger={
            <Button variant="link" className="w-full justify-center text-strentor-blue">
              <Plus className="w-4 h-4 mr-1" /> Add exercises from the library →
            </Button>
          }
          onPick={(ex) =>
            dispatch({
              type: "ADD_EXERCISE",
              week: weekNumber,
              day: dayNumber,
              exercise: { 
                uid: uuidv4(), 
                sets: [{ setNumber: 1, weight: "", reps: "", rest: 60, notes: "" }], 
                ...ex,
                isRepsBased: ex.isRepsBased, // NEW: Include reps-based flag
              },
            })
          }
        />
      </CardContent>
    </Card>
  )
}