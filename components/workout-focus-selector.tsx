"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  BODY_PARTS, 
  BodyPart, 
  parseBodyParts, 
  stringifyBodyParts 
} from "@/constants/workout-types";

interface WorkoutFocusSelectorProps {
  dayNumber: number;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
}

export function WorkoutFocusSelector({ 
  dayNumber, 
  value = "", 
  onChange,
  disabled = false,
  required = true,
  error = false
}: WorkoutFocusSelectorProps) {
  // Parse string value into array of body parts
  const [selectedParts, setSelectedParts] = useState<BodyPart[]>(parseBodyParts(value));
  
  // Update when the value prop changes
  useEffect(() => {
    setSelectedParts(parseBodyParts(value));
  }, [value]);

  const handleChange = (part: BodyPart, checked: boolean) => {
    const newSelection = checked
      ? [...selectedParts, part]
      : selectedParts.filter(p => p !== part);
    
    setSelectedParts(newSelection);
    onChange(stringifyBodyParts(newSelection));
  };

  // Determine border color based on validation state
  const borderClass = error && required && selectedParts.length === 0
    ? "border-red-400"
    : "border-gray-200";

  return (
    <div className={`p-4 rounded-md border ${borderClass} ${disabled ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <Label className="font-medium">
          Day {dayNumber} Focus:
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {selectedParts.length > 0 && (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
            {selectedParts.length} selected
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
        {Object.entries(BODY_PARTS).map(([key, label]) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox 
              id={`day-${dayNumber}-${key}`}
              checked={selectedParts.includes(key as BodyPart)}
              onCheckedChange={(checked) => 
                handleChange(key as BodyPart, checked as boolean)
              }
              disabled={disabled}
            />
            <Label 
              htmlFor={`day-${dayNumber}-${key}`}
              className={`text-sm cursor-pointer ${disabled ? 'text-gray-400' : ''}`}
            >
              {label}
            </Label>
          </div>
        ))}
      </div>
      
      {error && required && selectedParts.length === 0 && (
        <p className="text-sm text-red-500 mt-2">
          Please select at least one focus area
        </p>
      )}
    </div>
  );
} 