"use client"

import { PlanHeader } from "./plan-header";
import { WeekAndDaySelector } from "./week-and-day-selector";
import { DayCanvas } from "./day-canvas";

interface CreatePlanMainProps {
  mode: "create" | "edit" | "archive";
  trainerId?: string;
  planId?: string;
}

export function CreatePlanMain({ mode, trainerId, planId }: CreatePlanMainProps) {
  return (
    <div className="min-h-screen bg-background">
      <PlanHeader mode={mode} trainerId={trainerId} planId={planId} />

      <div className="flex h-[calc(100vh-4rem)]">
        <WeekAndDaySelector />
        <DayCanvas />
      </div>
    </div>
  );
}
