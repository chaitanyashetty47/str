"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MaxLiftOutput {
  id: string;
  exerciseName: string;
  exerciseType: string;
  maxWeight?: number;
  maxReps?: number;
  exerciseTypeEnum: "WEIGHT_BASED" | "REPS_BASED";
  dateAchieved: Date;
}

interface UniqueExerciseOption {
  exerciseName: string;
  exerciseType: string;
  exerciseId: string;
}

interface ExercisePRCarouselProps {
  uniqueExercises: UniqueExerciseOption[];
  allMaxLifts: MaxLiftOutput[];
}

export function ExercisePRCarousel({ uniqueExercises, allMaxLifts }: ExercisePRCarouselProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentExerciseData, setCurrentExerciseData] = useState<MaxLiftOutput[]>([]);

  // Memoize exercises that have at least one PR to prevent infinite re-renders
  const exercisesWithPRs = useMemo(() => {
    return uniqueExercises.filter(exercise => 
      allMaxLifts.some(lift => lift.exerciseName === exercise.exerciseName)
    );
  }, [uniqueExercises, allMaxLifts]);

  // Update current exercise data when index changes
  useEffect(() => {
    if (exercisesWithPRs.length > 0 && currentExerciseIndex < exercisesWithPRs.length) {
      const currentExercise = exercisesWithPRs[currentExerciseIndex];
      
      // Filter and group by date, taking the best PR for each date
      const filteredLifts = allMaxLifts.filter(lift => lift.exerciseName === currentExercise.exerciseName);
      
      // Group by date and take the best PR for each date
      const groupedByDate = filteredLifts.reduce((acc, lift) => {
        const date = new Date(lift.dateAchieved).toDateString();
        const isRepsBased = lift.exerciseTypeEnum === "REPS_BASED";
        
        if (!acc[date]) {
          acc[date] = lift;
        } else {
          // Compare and keep the better PR
          const currentBest = acc[date];
          const isCurrentBetter = isRepsBased 
            ? (lift.maxReps ?? 0) > (currentBest.maxReps ?? 0)
            : (lift.maxWeight ?? 0) > (currentBest.maxWeight ?? 0);
          
          if (isCurrentBetter) {
            acc[date] = lift;
          }
        }
        return acc;
      }, {} as Record<string, MaxLiftOutput>);

      // Convert back to array, sort by date, and take last 3 unique dates
      const exerciseData = Object.values(groupedByDate)
        .sort((a, b) => new Date(a.dateAchieved).getTime() - new Date(b.dateAchieved).getTime())
        .slice(-3); // Get last 3 unique dates
      
      setCurrentExerciseData(exerciseData);
    }
  }, [currentExerciseIndex, exercisesWithPRs, allMaxLifts]);

  // Reset index if it's out of bounds when exercises change
  useEffect(() => {
    if (exercisesWithPRs.length > 0 && currentExerciseIndex >= exercisesWithPRs.length) {
      setCurrentExerciseIndex(0);
    }
  }, [exercisesWithPRs.length, currentExerciseIndex]);

  const handlePrevious = () => {
    setCurrentExerciseIndex((prev) => 
      prev === 0 ? exercisesWithPRs.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentExerciseIndex((prev) => 
      prev === exercisesWithPRs.length - 1 ? 0 : prev + 1
    );
  };

  if (exercisesWithPRs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exercise Progress</CardTitle>
          <CardDescription>Track your personal records across all exercises</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <div className="text-lg font-medium mb-2">No Personal Records Yet</div>
            <div className="text-sm text-center">
              Start logging your workouts to see your exercise progress here!
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentExercise = exercisesWithPRs[currentExerciseIndex];
  const isRepsBased = currentExerciseData.length > 0 && currentExerciseData[0].exerciseTypeEnum === "REPS_BASED";

  // Safety check to prevent crashes
  if (!currentExercise) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exercise Progress</CardTitle>
          <CardDescription>Track your personal records across all exercises</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <div className="text-lg font-medium mb-2">Loading...</div>
            <div className="text-sm text-center">
              Preparing your exercise data...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Memoize chart data to prevent unnecessary recalculations
  const chartData = useMemo(() => {
    return currentExerciseData.map((entry) => ({
      date: new Date(entry.dateAchieved).toISOString().split('T')[0],
      value: isRepsBased ? entry.maxReps ?? 0 : entry.maxWeight ?? 0,
      weight: entry.maxWeight ?? 0,
      reps: entry.maxReps ?? 0,
    }));
  }, [currentExerciseData, isRepsBased]);

  // Memoize trend calculation
  const trendInfo = useMemo(() => {
    if (chartData.length < 2) {
      return { trendText: "", trendValue: 0, isUp: true };
    }
    
    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    const trendValue = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    const isUp = trendValue >= 0;
    const trendText = `${isUp ? "Trending up" : "Trending down"} by ${Math.abs(trendValue).toFixed(1)}%`;
    
    return { trendText, trendValue, isUp };
  }, [chartData]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Exercise Progress</CardTitle>
            <CardDescription>Track your personal records across all exercises</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={exercisesWithPRs.length <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[120px] text-center">
              {currentExerciseIndex + 1} of {exercisesWithPRs.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={exercisesWithPRs.length <= 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-xl font-bold text-card-foreground">{currentExercise.exerciseName}</h3>
          <p className="text-sm text-muted-foreground capitalize">{currentExercise.exerciseType}</p>
        </div>

        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <div className="text-lg font-medium mb-2">No Data Available</div>
            <div className="text-sm">Start logging workouts to see your progress here!</div>
          </div>
        ) : chartData.length === 1 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <div className="text-lg font-medium mb-2">Need More Data</div>
            <div className="text-sm">Log another PR to see your progress trend</div>
            <div className="mt-4 p-4 bg-primary/10 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {chartData[0].value}{isRepsBased ? '' : ' kg'}
                </div>
                <div className="text-sm text-primary">
                  {new Date(chartData[0].date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ left: 35, right: 12, top: 12, bottom: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    const d = new Date(value);
                    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
                  }}
                />
                <YAxis
                  dataKey="value"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={5}
                  width={35}
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{ 
                    background: "rgba(255, 189, 34, 0.6)", 
                    border: "1px solid rgba(255, 189, 34, 0.9)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(255, 189, 34, 0.3)",
                    backdropFilter: "blur(8px)"
                  }}
                  labelStyle={{ 
                    color: "#1a1a1a", 
                    fontWeight: "600",
                    fontSize: "12px"
                  }}
                  itemStyle={{ 
                    color: "#1a1a1a", 
                    fontWeight: "500",
                    fontSize: "11px"
                  }}
                  formatter={(value: any, name: string) => [
                    `${value}${isRepsBased ? '' : ' kg'}`, 
                    `${isRepsBased ? 'Reps' : 'ORM'}`
                  ]}
                  labelFormatter={(label) => {
                    const d = new Date(label);
                    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
                  }}
                />
                <Area
                  dataKey="value"
                  type="natural"
                  fill="rgba(255, 189, 34, 0.2)"
                  fillOpacity={0.3}
                  stroke="rgba(255, 189, 34, 0.8)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trend Information */}
        {chartData.length >= 2 && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium">
              {trendInfo.trendText} {trendInfo.isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">
              {chartData.length > 0 && (() => {
                const first = new Date(chartData[0].date);
                const last = new Date(chartData[chartData.length - 1].date);
                return `${first.getDate()} ${first.toLocaleString("default", { month: "short" })} - ${last.getDate()} ${last.toLocaleString("default", { month: "short" })} ${last.getFullYear()}`;
              })()}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}