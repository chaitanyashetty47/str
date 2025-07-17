"use client"

import { WeekInPlan } from "@/types/workout-plans-create/editor-state";
import { DayContainer } from "./day-container";

export function WeekContainer({ week, weekIndex }: { week: WeekInPlan; weekIndex: number }) {
  return (
    <div className="mb-8">
      <span className="text-base font-semibold">Week {weekIndex + 1}</span>
      <div className="flex flex-col gap-4 mt-4">
        {week.days.map((day, dayIndex) => (
          <DayContainer key={dayIndex} weekNumber={weekIndex + 1} dayNumber={dayIndex + 1} />
        ))}
      </div>
    </div>
  );
}