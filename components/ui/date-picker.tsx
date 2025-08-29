"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allowFutureDates?: boolean;
}

export function DatePicker({ 
  date, 
  onSelect, 
  disabled, 
  placeholder = "Pick a date",
  className,
  allowFutureDates = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          type="button"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => {
            onSelect(date);
            setIsOpen(false);
          }}
          initialFocus
          captionLayout="dropdown"
          disabled={(date) => {
            // Disable dates more than 100 years ago, and optionally future dates
            const today = new Date();
            const minDate = new Date(today.getFullYear() - 100, 0, 1);
            
            if (allowFutureDates) {
              return date < minDate; // Only disable very old dates
            } else {
              return date > today || date < minDate; // Disable future dates and very old dates
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

// Enhanced DatePicker with Label for form integration
interface DatePickerWithLabelProps extends DatePickerProps {
  label?: string;
  error?: string;
  required?: boolean;
}

export function DatePickerWithLabel({ 
  label, 
  error, 
  required, 
  ...props 
}: DatePickerWithLabelProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <DatePicker {...props} />
      {error && (
        <p className="text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

// DatePicker for React Hook Form integration
interface DatePickerFormProps extends Omit<DatePickerProps, 'date' | 'onSelect'> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export function DatePickerForm({ 
  value, 
  onChange, 
  onBlur, 
  label, 
  error, 
  required, 
  ...props 
}: DatePickerFormProps) {
  const date = value ? new Date(value) : undefined;

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Format as DD/MM/YYYY for form submission
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      onChange?.(formattedDate);
    } else {
      onChange?.("");
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <DatePicker
        date={date}
        onSelect={handleDateSelect}
        // onBlur={onBlur}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  );
} 