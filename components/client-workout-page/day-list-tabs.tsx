import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DayDetail } from "@/actions/client-workout/client-full-workout.action";

interface DayListTabsProps {
  days: DayDetail[];
  selectedDay: number;
  onDaySelect: (dayNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;
}

export default function DayListTabs({ days, selectedDay, onDaySelect }: DayListTabsProps) {
  // Define all possible days (1-7)
  const allDays = [1, 2, 3, 4, 5, 6, 7] as const;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {allDays.map((dayNumber) => {
        const dayData = days.find(d => d.dayNumber === dayNumber);
        const isSelected = selectedDay === dayNumber;
        const hasExercises = dayData && dayData.exercises.length > 0;
        const isDisabled = !dayData;

        // Truncate title if too long
        const truncateTitle = (title: string, maxLength: number = 12) => {
          return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
        };

        // Format date as DD-MM-YYYY
        const formatDate = (isoDate: string) => {
          const date = new Date(isoDate);
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        };

        return (
          <Button
            key={dayNumber}
            variant="outline"
            className={cn(
              "h-16 px-3 py-2 flex flex-col items-center justify-center gap-1 rounded-lg border-2 transition-all duration-200",
              {
                "bg-strentor-orange text-black border-strentor-orange hover:bg-strentor-orange/90 hover:text-black shadow-md": isSelected && hasExercises,
                "bg-white border-strentor-orange/30 text-gray-600 hover:bg-strentor-orange/10 hover:text-gray-800 hover:border-strentor-orange/50": !isSelected && hasExercises,
                "bg-muted text-muted-foreground cursor-not-allowed border-muted": isDisabled,
                "border-dashed border-gray-300 text-gray-400 hover:text-gray-500": !hasExercises && dayData,
              }
            )}
            disabled={isDisabled}
            onClick={() => !isDisabled && onDaySelect(dayNumber)}
          >
            <span className="text-xs font-semibold">
              {dayData ? `Day ${dayNumber} (${formatDate(dayData.dayDate)})` : `Day ${dayNumber}`}
            </span>
            <span className="text-xs text-center leading-tight">
              {dayData ? (
                hasExercises ? (
                  <>
                    {truncateTitle(dayData.title)}
                    <br />
                    <span className="text-[10px] opacity-75">
                      ({new Date(dayData.dayDate).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })})
                    </span>
                  </>
                ) : (
                  "No exercises"
                )
              ) : (
                "Rest day"
              )}
            </span>
          </Button>
        );
      })}
    </div>
  );
}