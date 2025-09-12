"use client"
import { cn } from "@/lib/utils";
import { usePlanState } from "@/contexts/PlanEditorContext";
import { WeekContainer } from "./week-container";
import { addDays } from "date-fns";
import { formatWeekRange } from "@/utils/date-utils";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

export function DayCanvas({ className = "" }: { className?: string }) {
  const { meta, weeks, selectedWeek, selectedDay } = usePlanState();

  return (
    <div className={cn("w-full px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8", className)}>
      {weeks.map((week, weekIndex) => (
        <section key={weekIndex} id={`week-${weekIndex + 1}`} className="scroll-mt-20 md:scroll-mt-6">
          {/* Week Header */}
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-blue-50 rounded-lg border border-blue-200">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">
                Week {weekIndex + 1}
              </span>
              <span className="text-xs text-blue-600">
                ({formatWeekRange(addDays(meta.startDate, weekIndex * 7))})
              </span>
            </div>
          </div>

          {/* Week Content */}
          <WeekContainer week={week} weekIndex={weekIndex} />

          {/* Week Divider (except for last week) */}
          {weekIndex < weeks.length - 1 && (
            <div className="mt-6 md:mt-8 mb-3 md:mb-4">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}