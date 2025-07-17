"use client";

import { useState, useMemo } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { WeightAreaChartFull, WeightAreaChartData } from "@/components/charts/area/weight_area_chart_full";

type Exercise = { id: string; name: string };
type Props = {
  exercises: Exercise[];
  data: {
    exercise_id: string;
    date_logged: string;
    weight_used: number | null;
  }[];
};

export function ExerciseChartClient({ exercises, data }: Props) {
  const [selectedId, setSelectedId] = useState(exercises[0]?.id);

  const chartData: WeightAreaChartData[] = useMemo(
    () =>
      data
        .filter((row) => row.exercise_id === selectedId && row.weight_used !== null)
        .map((row) => ({
          date: new Date(row.date_logged),
          value: row.weight_used as number,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [selectedId, data]
  );

  const selectedName = exercises.find((ex) => ex.id === selectedId)?.name ?? "";

  return (
    <div>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Exercise</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="border rounded px-2 py-1 w-full max-w-xs text-left">
              {selectedName}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {exercises.map((ex) => (
              <DropdownMenuItem key={ex.id} onSelect={() => setSelectedId(ex.id)}>
                {ex.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <WeightAreaChartFull data={chartData} />
    </div>
  );
}