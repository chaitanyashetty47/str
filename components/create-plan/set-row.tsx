"use client";

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { MessageSquare, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Textarea } from "../ui/textarea";
import { usePlanDispatch } from "@/contexts/PlanEditorContext";
import { useState } from "react";
import { getDisplayWeight } from "@/utils/weight";
import { IntensityMode } from "@prisma/client";

interface SetRowProps {
  weekNumber: number;
  dayNumber: number;
  exerciseUid: string;
  setNumber: number;
  weight: string;
  reps: string;
  rest: number;
  notes: string;
  oneRM?: number;
  intensityMode: IntensityMode;
}

export function SetRow({
  weekNumber,
  dayNumber,
  exerciseUid,
  setNumber,
  weight,
  reps,
  rest,
  notes,
  oneRM,
  intensityMode,
}: SetRowProps) {
  const dispatch = usePlanDispatch();
  const [isOpen, setIsOpen] = useState(false);

  const update = (field: "weight" | "reps" | "rest" | "notes", value: string | number) =>
    dispatch({
      type: "UPDATE_SET_FIELD",
      week: weekNumber,
      day: dayNumber,
      uid: exerciseUid,
      set: setNumber,
      field,
      value,
    });

  return (
    <div className="grid grid-cols-12 gap-2 items-center text-sm">
      <span className="col-span-1 text-center">{setNumber}</span>

      {/* Weight */}
      <div className="col-span-3 flex flex-col gap-0.5">
        <div className="flex items-center gap-1">
          <Input
            value={weight}
            onChange={(e) => update("weight", e.target.value)}
            className="h-8"
          />
          <span className="text-xs text-muted-foreground">
            {intensityMode === IntensityMode.ABSOLUTE ? "kg" : "%"}
          </span>
        </div>
        {/* Display absolute conversion when in % mode and numeric weight */}
        {intensityMode === IntensityMode.PERCENT && !!Number(weight) && (
          <span className="text-[10px] text-muted-foreground ml-1">
            {oneRM
              ? getDisplayWeight(Number(weight), intensityMode, oneRM)
              : "No 1-RM"}
          </span>
        )}
      </div>

      {/* Reps */}
      <Input
        value={reps}
        onChange={(e) => update("reps", e.target.value)}
        className="col-span-2 h-8"
      />

      {/* Rest */}
      <Input
        value={rest}
        onChange={(e) => update("rest", Number(e.target.value) || 0)}
        className="col-span-2 h-8"
      />

      {/* Notes */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="col-span-1">
            <MessageSquare className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <h4 className="font-medium mb-2">Set {setNumber} Notes</h4>
          <Textarea
            placeholder="Add notes for this set (e.g., tempo, cues)…"
            value={notes}
            onChange={(e) => update("notes", e.target.value)}
            className="mb-3"
          />
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="col-span-1"
        onClick={() =>
          dispatch({
            type: "DELETE_SET",
            week: weekNumber,
            day: dayNumber,
            uid: exerciseUid,
            set: setNumber,
          })
        }
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
