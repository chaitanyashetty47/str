"use client"
import { cn } from "@/lib/utils";
import { usePlanState } from "@/contexts/PlanEditorContext";
import { WeekContainer } from "./week-container";

export function DayCanvas({ className = "" }: { className?: string }) {
  const { meta, weeks, selectedWeek, selectedDay } = usePlanState();

  return (
    <div className={cn("px-6 py-8 space-y-8 max-w-4xl pr-6", className)}>
      {weeks.map((week, weekIndex) => (
        <WeekContainer key={weekIndex} week={week} weekIndex={weekIndex} />
      ))}
    </div>
  )
}