"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientProgressFilterProps {
  availableWeeks: number[];
  daysInCurrentWeek: number[];
  currentWeek: number | null;
  selectedDay: number | null;
}

export default function ClientProgressFilter({
  availableWeeks,
  daysInCurrentWeek,
  currentWeek,
  selectedDay
}: ClientProgressFilterProps) {
  const router = useRouter();

  const handleWeekChange = (value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("week", value);
    // Clear day when changing week
    url.searchParams.delete("day");
    router.push(url.pathname + '?' + url.searchParams.toString());
  };

  const handleDayChange = (value: string) => {
    const url = new URL(window.location.href);
    if (value === "all") {
      // Remove the day parameter to show all days
      url.searchParams.delete("day");
    } else {
      url.searchParams.set("day", value);
    }
    router.push(url.pathname + '?' + url.searchParams.toString());
  };

  return (
    <div className="flex items-center gap-4">
      <Select
        value={currentWeek?.toString() || ""}
        onValueChange={handleWeekChange}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select Week" />
        </SelectTrigger>
        <SelectContent>
          {availableWeeks.map(week => (
            <SelectItem key={week} value={week.toString() }>
              Week {week}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentWeek !== null && daysInCurrentWeek.length > 0 && (
        <Select
          value={selectedDay?.toString() || "all"}
          onValueChange={handleDayChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select Day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Days</SelectItem>
            {daysInCurrentWeek.map(day => (
              <SelectItem key={day} value={day.toString()}>
                Day {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
} 