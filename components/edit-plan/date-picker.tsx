"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: boolean;
}

export function DatePicker({ date, onSelect, disabled }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal border-2",
          !date && "text-muted-foreground"
        )}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP") : "Select a date"}
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 rounded-md border bg-background shadow-md">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              onSelect(date);
              setIsOpen(false);
            }}
            initialFocus
          />
        </div>
      )}
    </div>
  );
} 