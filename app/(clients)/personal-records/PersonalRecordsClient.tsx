"use client";

import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { PersonalRecordsChart } from "@/components/charts/PersonalRecordsChart";
import { ClientTooltip } from "@/components/charts/ClientTooltip";
import { BodyPart } from "@prisma/client";

interface MaxLiftOutput {
  exerciseName: string;
  exerciseType: BodyPart;
  maxWeight?: number; // For weight-based exercises
  maxReps?: number;   // For reps-based exercises
  exerciseTypeEnum: "WEIGHT_BASED" | "REPS_BASED"; // Track exercise type
  dateAchieved: Date;
}

interface UniqueExerciseOption {
  exerciseName: string;
  exerciseType: BodyPart;
  exerciseId: string;
}

interface PersonalRecordData {
  date: Date;
  weight: number;
  exerciseName: string;
}

interface PersonalRecordsClientProps {
  uniqueExercises: UniqueExerciseOption[];
  allMaxLifts: MaxLiftOutput[];
}

export function PersonalRecordsClient({ uniqueExercises, allMaxLifts }: PersonalRecordsClientProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | "">("");
  const [chartData, setChartData] = useState<PersonalRecordData[]>([]);

  // Filter chart data based on selected exercise and body part
  useEffect(() => {
    if (!selectedExercise && !selectedBodyPart) {
      setChartData([]);
      return;
    }

    let filteredData = allMaxLifts;

    if (selectedExercise) {
      filteredData = filteredData.filter(lift => lift.exerciseName === selectedExercise);
    }

    if (selectedBodyPart) {
      filteredData = filteredData.filter(lift => lift.exerciseType === selectedBodyPart);
    }

    // Convert to chart data format
    const chartDataFormatted = filteredData.map(lift => ({
      date: new Date(lift.dateAchieved),
      weight: lift.maxWeight ?? 0,
      exerciseName: lift.exerciseName,
    }));

    setChartData(chartDataFormatted);
  }, [selectedExercise, selectedBodyPart, allMaxLifts]);

  // Get unique body parts for dropdown
  const uniqueBodyParts = Array.from(new Set(uniqueExercises.map(ex => ex.exerciseType)));

  // Filter exercises based on selected body part
  const filteredExercises = selectedBodyPart 
    ? uniqueExercises.filter(ex => ex.exerciseType === selectedBodyPart)
    : uniqueExercises;

  return (
    <ClientTooltip>
      <div className="flex flex-col gap-6">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Body Part Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Body Part</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-48">
                  <ChevronDown className="w-4 h-4 mr-2" />
                  <span>{selectedBodyPart || "Select Body Part"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {/* <DropdownMenuItem onClick={() => setSelectedBodyPart("")}>
                  All Body Parts
                </DropdownMenuItem> */}
                {uniqueBodyParts.map((bodyPart) => (
                  <DropdownMenuItem 
                    key={bodyPart} 
                    onClick={() => {
                      setSelectedBodyPart(bodyPart);
                      setSelectedExercise("");
                    }}
                  >
                    {bodyPart}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Exercise Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Exercise</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-48">
                  <ChevronDown className="w-4 h-4 mr-2" />
                  <span>{selectedExercise || "Select Exercise"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {/* <DropdownMenuItem onClick={() => setSelectedExercise("")}>
                  All Exercises
                </DropdownMenuItem> */}
                {filteredExercises.map((exercise) => (
                  <DropdownMenuItem 
                    key={exercise.exerciseId} 
                    onClick={
                      () => {
                        setSelectedExercise(exercise.exerciseName);
                        setSelectedBodyPart(exercise.exerciseType);
                      }
                    }
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{exercise.exerciseName}</span>
                      <span className="text-sm text-muted-foreground">{exercise.exerciseType}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Clear Filters Button */}
          {(selectedExercise || selectedBodyPart) && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-transparent">Actions</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedExercise("");
                  setSelectedBodyPart("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{allMaxLifts.length}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{uniqueExercises.length}</div>
            <div className="text-sm text-gray-600">Unique Exercises</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">{chartData.length}</div>
            <div className="text-sm text-gray-600">Filtered Records</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <PersonalRecordsChart 
            data={chartData} 
            exerciseName={selectedExercise || "All Exercises"} 
          />
        </div>

        {/* Exercise List */}
        {!selectedExercise && !selectedBodyPart && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Available Exercises</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {uniqueExercises.map((exercise) => (
                <div 
                  key={exercise.exerciseId}
                  className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => setSelectedExercise(exercise.exerciseName)}
                >
                  <div className="font-medium">{exercise.exerciseName}</div>
                  <div className="text-sm text-gray-500">{exercise.exerciseType}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ClientTooltip>
  );
} 