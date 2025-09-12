import { useMemo, useState } from "react";
import { addDays } from "date-fns";
import { GripVertical, Plus, MoreHorizontal, CheckCircle2 } from "lucide-react";

import { usePlanState, usePlanDispatch, usePlanHelpers } from "../../contexts/PlanEditorContext";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatWeekRange } from "@/utils/date-utils";

export function WeekAndDaySelector() {
  const { weeks, selectedWeek, selectedDay, meta } = usePlanState();
  const dispatch = usePlanDispatch();
  const { canAddDay, canDeleteDay, getTotalDays } = usePlanHelpers();

  // Accordion open state: keep all open by default
  const [openAccordions, setOpenAccordions] = useState<string[]>(
    weeks.map((w) => `week-${w.weekNumber}`)
  );

  const totalDays = getTotalDays();

  const groupedWeeks = weeks; // alias for clarity

  const addWeek = () => dispatch({ type: "ADD_WEEK" });
  
  const addDay = (weekNum: number) => dispatch({ type: "ADD_DAY", week: weekNum });
  
  const deleteDay = (weekNum: number, dayNum: number) => dispatch({ type: "DELETE_DAY", week: weekNum, day: dayNum });

  const selectDay = (weekNum: number, dayNum: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    dispatch({ type: "SELECT_WEEK_DAY", week: weekNum, day: dayNum });
    
    // Smooth scroll to the selected day
    const targetId = `week-${weekNum}-day-${dayNum}`;
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  // memo helper to check if all 3 days have at least 1 exercise
  const isWeekCompleted = (weekIndex: number) => {
    const week = weeks[weekIndex];
    return week.days.every((d) => d.exercises.length > 0);
  };

  return (
    <aside className="border-r bg-gray-50 p-4 overflow-y-auto w-[320px] sticky top-0 h-[calc(100vh-4rem)] z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">Total: {totalDays} days</span>
        <Button variant="outline" size="sm" className="bg-primary text-primary-foreground" onClick={addWeek}>
          <Plus className="h-4 w-4 mr-1" />
          Add Week
        </Button>
      </div>

      <Accordion
        type="multiple"
        value={openAccordions}
        onValueChange={(val) => setOpenAccordions(val as string[])}
        className="space-y-2"
      >
        {groupedWeeks.map((week, idx) => (
          <AccordionItem
            key={week.weekNumber}
            value={`week-${week.weekNumber}`}
            className="border rounded-lg"
          >
            {/* Week header */}
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <div className="flex items-center justify-between w-full mr-2">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Week {week.weekNumber}</span>
                  {isWeekCompleted(idx) && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatWeekRange(addDays(meta.startDate, idx * 7))}
                  </span>
                  {/* Placeholder kebab menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <span
                        className="h-6 w-6 p-0 inline-flex items-center justify-center rounded hover:bg-accent cursor-pointer"
                      >
                        <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) =>
                        {
                          e.stopPropagation();
                          dispatch({ type: "DUPLICATE_WEEK", week: week.weekNumber });
                        }}>Duplicate Week</DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) =>
                        {
                          e.stopPropagation();
                          dispatch({ type: "DELETE_WEEK", week: week.weekNumber });
                        }}>Delete Week</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </AccordionTrigger>

            {/* Days list */}
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-1">
                {week.days.map((day) => {
                  const isSelected =
                    selectedWeek === week.weekNumber && selectedDay === day.dayNumber;
                  return (
                    <div
                      key={`${week.weekNumber}-${day.dayNumber}`}
                      className={cn(
                        "w-full rounded-md transition-colors flex items-center justify-between",
                        isSelected
                          ? "bg-blue-100 text-blue-900 font-medium"
                          : "hover:bg-gray-100"
                      )}
                    >
                      <button
                        onClick={() => selectDay(week.weekNumber, day.dayNumber)}
                        className="flex-1 text-left p-2 rounded-md"
                      >
                        <span className="text-sm">
                          {day.title || `Day ${day.dayNumber}`}
                          <span className="text-xs text-muted-foreground ml-1">
                            (Day {day.dayNumber})
                          </span>
                        </span>
                      </button>
                      <div className="flex items-center gap-1 pr-2">
                        {day.exercises.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {day.exercises.length}
                          </Badge>
                        )}
                        {canDeleteDay(week.weekNumber) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <span className="h-6 w-6 p-0 inline-flex items-center justify-center rounded hover:bg-accent cursor-pointer">
                                <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDay(week.weekNumber, day.dayNumber);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                Delete Day
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Add Day Button */}
                {canAddDay(week.weekNumber) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addDay(week.weekNumber)}
                    className="w-full text-left p-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 transition-colors"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    <span className="text-xs text-muted-foreground">Add Day</span>
                  </Button>
                )}
    </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
}