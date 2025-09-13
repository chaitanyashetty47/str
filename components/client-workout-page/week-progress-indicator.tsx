import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getWeekRangeSimple } from "@/utils/date-utils";

interface WeekProgressIndicatorProps {
  planId?: string;    // Add planId for logging links
  planStartDate?: string; // Add plan start date to calculate week dates
  weekDuration: number;
  currentWeek: number;
  selectedWeek?: number;
  onWeekSelect?: (weekNumber: number) => void;
}

export default function WeekProgressIndicator({ planId, planStartDate, weekDuration, currentWeek, selectedWeek, onWeekSelect }: WeekProgressIndicatorProps) {
  // Helper to get week date range for a specific week number
  const getWeekDateRange = (weekNumber: number) => {
    if (!planStartDate) return null;
    
    const startDate = new Date(planStartDate);
    // Calculate the Monday of the target week (week 1 starts on plan start date's week)
    const daysToAdd = (weekNumber - 1) * 7;
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + daysToAdd);
    
    return getWeekRangeSimple(weekStart);
  };

  return (
    <div className="w-fit shadow-md rounded-md p-4">
      <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 flex-wrap justify-center">
        {/* Previous weeks: darker red ✅ Current week: red + ring ✅ Upcoming weeks: lighter red */}
        {Array.from({ length: weekDuration }).map((_, index) => {
          const weekNumber = index + 1;
          const isCurrentWeek = weekNumber === currentWeek;
          const isPreviousWeek = weekNumber < currentWeek;
          const isFutureWeek = weekNumber > currentWeek;
          const isSelected = selectedWeek === weekNumber;

          return (
            <div key={weekNumber} className="flex flex-col items-center gap-2 relative">
              <Button
                className={cn(
                  "w-10 h-10 rounded-full text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105",
                  {
                    // Current week: always has ring outline and full red color
                    "bg-strentor-red ring-2 ring-offset-2 ring-strentor-red shadow-lg": isCurrentWeek,
                    // Previous weeks: darker red, no ring even when selected
                    "bg-strentor-red/80 hover:bg-strentor-red/90": isPreviousWeek,
                    // Future weeks: lighter red, no ring even when selected
                    "bg-strentor-red/20 hover:bg-strentor-red/30": isFutureWeek,
                  }
                )}
                onClick={() => onWeekSelect?.(weekNumber)}
              >
                {weekNumber}
              </Button>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm text-muted-foreground">Week {weekNumber}</span>
                {/* Selection indicator - animated dash (shows for selected week, not current week) */}
                <div 
                  className={cn(
                    "h-0.5 bg-strentor-red transition-all duration-300 ease-in-out",
                    isSelected ? "w-8 opacity-100" : "w-0 opacity-0"
                  )}
                />
                {/* Check logs button - only show when week is selected and we have planId */}
                {/* {isSelected && planId && planStartDate && (
                  <div className="mt-2">
                    {(() => {
                      const weekRange = getWeekDateRange(weekNumber);
                      return weekRange ? (
                        <Link href={`/workout/${planId}?startDate=${weekRange.startDate}&endDate=${weekRange.endDate}`}>
                          <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-6">
                            Check logs for Week {weekNumber}
                          </Button>
                        </Link>
                      ) : (
                        <Button size="sm" variant="outline" className="text-xs px-2 py-1 h-6" disabled>
                          Check logs for Week {weekNumber}
                        </Button>
                      );
                    })()}
                  </div>
                )} */}
              </div>
            </div>
          );
        })}
      </div>
    
    </div>
  );
}