"use client"

import { WeekInPlan } from "@/types/workout-plans-create/editor-state";
import { DayContainer } from "./day-container";

export function WeekContainer({ week, weekIndex }: { week: WeekInPlan; weekIndex: number }) {
  return (
    <div className="space-y-4">
      {week.days.map((day, dayIndex) => (
        <DayContainer key={dayIndex} weekNumber={weekIndex + 1} dayNumber={dayIndex + 1} />
      ))}
    </div>
  );
}