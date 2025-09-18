"use client";

import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, MoreVertical, AlertTriangle } from "lucide-react";
import { PRTrendChart } from "@/components/personal-records/PRTrendChart";
import { ClientTooltip } from "@/components/charts/ClientTooltip";
import { BodyPart } from "@prisma/client";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { PRInvalidationModal } from "@/components/personal-records/PRInvalidationModal";
import { toast } from "sonner";

interface MaxLiftOutput {
  id: string; // NEW: PR ID for invalidation
  exerciseName: string;
  exerciseType: BodyPart;
  maxWeight?: number; // For weight-based exercises
  maxReps?: number;   // For reps-based exercises
  exerciseTypeEnum: "WEIGHT_BASED" | "REPS_BASED"; // Track exercise type
  dateAchieved: Date;
  isInvalid?: boolean; // NEW: Track invalidation status
}

interface UniqueExerciseOption {
  exerciseName: string;
  exerciseType: BodyPart;
  exerciseId: string;
}

interface PersonalRecordData {
  date: string;        // Changed from Date to string
  weight: number;
  reps: number;        
  exerciseName: string;
  isPR: boolean;      
}

interface PersonalRecordsClientProps {
  uniqueExercises: UniqueExerciseOption[];
  allMaxLifts: MaxLiftOutput[];
}

export function PersonalRecordsClient({ uniqueExercises, allMaxLifts }: PersonalRecordsClientProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | "">("");
  const [chartData, setChartData] = useState<PersonalRecordData[]>([]);
  
  // Chart pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const pageSize = 10;
  
  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Filtered table data state
  const [filteredTableData, setFilteredTableData] = useState<MaxLiftOutput[]>([]);
  
  // PR Invalidation modal state
  const [invalidationModal, setInvalidationModal] = useState<{
    isOpen: boolean;
    prId: string;
    exerciseName: string;
    isInvalidated: boolean;
  }>({
    isOpen: false,
    prId: "",
    exerciseName: "",
    isInvalidated: false,
  });

  // Filter data based on selected exercise, body part, and date range
  useEffect(() => {
    let filteredData = allMaxLifts;

    // Exercise filter
    if (selectedExercise) {
      filteredData = filteredData.filter(lift => lift.exerciseName === selectedExercise);
    }

    // Body part filter
    if (selectedBodyPart) {
      filteredData = filteredData.filter(lift => lift.exerciseType === selectedBodyPart);
    }

    // Date range filter
    if (dateRange?.from && dateRange?.to) {
      filteredData = filteredData.filter(lift => {
        const liftDate = new Date(lift.dateAchieved);
        const fromDate = new Date(dateRange.from!);
        const toDate = new Date(dateRange.to!);
        return liftDate >= fromDate && liftDate <= toDate;
      });
    }

    // Sort by date (newest first)
    filteredData.sort((a, b) => new Date(b.dateAchieved).getTime() - new Date(a.dateAchieved).getTime());

    // Set filtered table data
    setFilteredTableData(filteredData);

    // Convert to chart data format
    const chartDataFormatted = filteredData.map(lift => ({
      date: new Date(lift.dateAchieved).toISOString().split('T')[0], // Convert to string
      weight: lift.maxWeight ?? 0,
      reps: lift.maxReps ?? 0,        // NEW: Include reps
      exerciseName: lift.exerciseName,
      isPR: true,                    // NEW: All records are PRs
      exerciseTypeEnum: lift.exerciseTypeEnum, // NEW: Include exercise type for chart
    }));

    setChartData(chartDataFormatted);
  }, [selectedExercise, selectedBodyPart, dateRange, allMaxLifts]);

  // Initialize filtered table data on mount
  useEffect(() => {
    if (allMaxLifts.length > 0 && filteredTableData.length === 0) {
      const sortedData = [...allMaxLifts].sort((a, b) => 
        new Date(b.dateAchieved).getTime() - new Date(a.dateAchieved).getTime()
      );
      setFilteredTableData(sortedData);
    }
  }, [allMaxLifts, filteredTableData.length]);

  // Chart pagination handlers
  const handlePageChange = (direction: 'prev' | 'next' | 'all') => {
    if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (direction === 'next') {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'all') {
      setCurrentPage(1);
    }
  };

  // PR Invalidation handlers
  const handleInvalidatePr = (prId: string, exerciseName: string, isInvalidated: boolean) => {
    setInvalidationModal({
      isOpen: true,
      prId,
      exerciseName,
      isInvalidated,
    });
  };

  const handleInvalidationSuccess = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  const closeInvalidationModal = () => {
    setInvalidationModal({
      isOpen: false,
      prId: "",
      exerciseName: "",
      isInvalidated: false,
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedExercise("");
    setSelectedBodyPart("");
    setDateRange(undefined);
  };

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
                <Button variant="outline" className="w-48 bg-primary hover:bg-red-700 text-white border-red-600">
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
                <Button variant="outline" className="w-48 bg-primary hover:bg-red-700 text-white border-red-600">
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

          {/* Date Range Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Date Range</label>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              placeholder="Select date range"
              className="w-64 [&_button]:text-red-600 [&_button]:border-red-600 [&_button:hover]:text-red-700 [&_button:hover]:border-red-700"
            />
          </div>

          {/* Clear Filters Button */}
          {(selectedExercise || selectedBodyPart || dateRange) && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-transparent">Actions</label>
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
                className="bg-primary hover:bg-primary/50 text-white border-red-600"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Stats */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div> */}

        {/* Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          {!selectedBodyPart || !selectedExercise ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <div className="text-lg font-medium mb-2">Select Filters to View Chart</div>
              <div className="text-sm text-center">
                Select a Body Part and Exercise to show your Progress Chart 
              </div>
            </div>
          ) : (
            <PRTrendChart 
              data={chartData} 
              exerciseName={selectedExercise}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              totalPages={Math.ceil(chartData.length / pageSize)}
              showPagination={chartData.length > pageSize}
            />
          )}
        </div>

        {/* Personal Records Table */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Personal Records</h3>
          {filteredTableData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No personal records found. Start logging your workouts to see your PRs here!
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Exercise</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">ORM</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Reps</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTableData.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-2">
                        {new Date(record.dateAchieved).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="py-3 px-2 font-medium">{record.exerciseName}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {record.exerciseTypeEnum === "WEIGHT_BASED" ? "ORM" : "Reps"}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {record.maxWeight ? `${record.maxWeight} kg` : "-"}
                      </td>
                      <td className="py-3 px-2">
                        {record.maxReps ? `${record.maxReps}` : "-"}
                      </td>
                      <td className="py-3 px-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleInvalidatePr(
                                record.id, 
                                record.exerciseName, 
                                record.isInvalid || false
                              )}
                              className="text-red-600 focus:text-red-600"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              {record.isInvalid ? "Restore PR" : "Invalidate PR"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Exercise List - Only show when no filters applied */}
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

        {/* PR Invalidation Modal */}
        <PRInvalidationModal
          isOpen={invalidationModal.isOpen}
          onClose={closeInvalidationModal}
          prId={invalidationModal.prId}
          exerciseName={invalidationModal.exerciseName}
          isInvalidated={invalidationModal.isInvalidated}
          onSuccess={handleInvalidationSuccess}
        />
      </div>
    </ClientTooltip>
  );
} 