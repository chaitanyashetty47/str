"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Trophy, TrendingUp, Calendar, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

import { useWeeklyAnalytics } from "@/hooks/use-workout-analytics";

interface WeeklyAnalyticsProps {
  planId: string;
  weekNumber: number;
}

export default function WeeklyAnalytics({ planId, weekNumber }: WeeklyAnalyticsProps) {
  const { data, loading, error } = useWeeklyAnalytics(planId, weekNumber);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  // Set initial selections when data loads
  useEffect(() => {
    if (data && data.exercises.length > 0) {
      const firstExercise = data.exercises[0];
      const firstDayKey = `${firstExercise.dayNumber}-${firstExercise.dayTitle}`;
      setSelectedDay(firstDayKey);
      setSelectedExerciseId(firstExercise.exerciseId);
    }
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Week {weekNumber} Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-strentor-red"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Week {weekNumber} Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.exercises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Week {weekNumber} Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No workout data available for Week {weekNumber}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group exercises by day
  const exercisesByDay = data.exercises.reduce((acc, exercise) => {
    const dayKey = `${exercise.dayNumber}-${exercise.dayTitle}`;
    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(exercise);
    return acc;
  }, {} as Record<string, typeof data.exercises>);

  // Get available days
  const availableDays = Object.keys(exercisesByDay).sort((a, b) => {
    const dayA = parseInt(a.split('-')[0]);
    const dayB = parseInt(b.split('-')[0]);
    return dayA - dayB;
  });

  // Get exercises for selected day
  const dayExercises = selectedDay ? exercisesByDay[selectedDay] || [] : [];
  
  // Get current exercise
  const currentExercise = dayExercises.find(ex => ex.exerciseId === selectedExerciseId) || dayExercises[0];

  // Handler for day selection
  const handleDayChange = (dayKey: string) => {
    setSelectedDay(dayKey);
    const exercises = exercisesByDay[dayKey];
    if (exercises && exercises.length > 0) {
      setSelectedExerciseId(exercises[0].exerciseId);
    }
  };

  // Handler for exercise selection
  const handleExerciseChange = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
  };

  // Early return if no current exercise
  if (!currentExercise) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Week {weekNumber} Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No exercise data available for the selected filters
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data for current exercise
  const chartData = currentExercise.sets.map((set) => ({
    setNumber: `Set ${set.setNumber}`,
    orm: set.orm || 0,
    weight: set.weight || 0,
    reps: set.reps || 0,
    isCompleted: set.isCompleted,
    isPR: set.isPR,
  }));

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {data.isCompleted ? (
            <>
              <p className="text-sm text-muted-foreground">
                Weight: {data.weight} kg
              </p>
              <p className="text-sm text-muted-foreground">
                Reps: {data.reps}
              </p>
              <p className="text-sm font-medium text-strentor-red">
                ORM: {data.orm} kg
              </p>
              {data.isPR && (
                <p className="text-sm font-bold text-yellow-600">
                  🏆 New PR!
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Not completed</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Get exercise PRs for this week
  const exercisePRs = data.prsAchieved.filter(
    (pr) => pr.exerciseId === currentExercise.exerciseId
  );

  return (
    <div className="space-y-6">
      {/* Week Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-strentor-red" />
              Week {weekNumber} Analytics
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {data.totalCompletedSets}/{data.totalSets} sets completed
              </span>
              <span>
                {Math.round((data.totalCompletedSets / data.totalSets) * 100)}%
                completion
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* PRs Achieved This Week */}
          {data.prsAchieved.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                Personal Records Achieved This Week
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.prsAchieved.map((pr) => (
                  <Badge
                    key={pr.exerciseId}
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  >
                    {pr.exerciseName}: {pr.newPR} kg
                    {pr.improvement && (
                      <span className="ml-1 text-xs">
                        (+{pr.improvement} kg)
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Day and Exercise Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Day Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-strentor-red" />
                Select Day
              </label>
              <Select value={selectedDay} onValueChange={handleDayChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a day..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDays.map((dayKey) => {
                    const [dayNum, ...titleParts] = dayKey.split('-');
                    const dayTitle = titleParts.join('-');
                    const dayExerciseCount = exercisesByDay[dayKey].length;
                    return (
                      <SelectItem key={dayKey} value={dayKey}>
                        Day {dayNum} - {dayTitle} ({dayExerciseCount} exercises)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Exercise Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-strentor-red" />
                Select Exercise
              </label>
              <Select value={selectedExerciseId} onValueChange={handleExerciseChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an exercise..." />
                </SelectTrigger>
                <SelectContent>
                  {dayExercises.map((exercise) => (
                    <SelectItem key={exercise.exerciseId} value={exercise.exerciseId}>
                      {exercise.exerciseName} ({exercise.bodyPart})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Exercise Info */}
          <div className="text-center mb-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-lg">{currentExercise.exerciseName}</h3>
            <p className="text-sm text-muted-foreground">
              {currentExercise.bodyPart} • Day {currentExercise.dayNumber} - {currentExercise.dayTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(currentExercise.dayDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {/* Exercise Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-strentor-red">
                {currentExercise.bestORM || 0}
              </p>
              <p className="text-sm text-muted-foreground">Best ORM (kg)</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">
                {Math.round(currentExercise.totalVolume)}
              </p>
              <p className="text-sm text-muted-foreground">Total Volume (kg)</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">
                {currentExercise.completionRate}%
              </p>
              <p className="text-sm text-muted-foreground">Completion Rate</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="setNumber"
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                  label={{
                    value: "ORM (kg)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orm" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        !entry.isCompleted
                          ? "#e5e7eb" // Gray for incomplete
                          : entry.isPR
                          ? "#fbbf24" // Gold for PR
                          : "#ef4444" // Red for completed
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-strentor-red rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span>Personal Record</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>Not Completed</span>
            </div>
          </div>

          {/* Exercise PRs Details */}
          {exercisePRs.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                PR Details for {currentExercise.exerciseName}
              </h4>
              {exercisePRs.map((pr) => (
                <div key={pr.exerciseId} className="text-sm text-yellow-700">
                  <p>
                    New Record: <strong>{pr.newPR} kg</strong>
                  </p>
                  <p>
                    Achieved with: {pr.setDetails.weight} kg × {pr.setDetails.reps} reps
                    (Set {pr.setDetails.setNumber})
                  </p>
                  {pr.improvement && (
                    <p>Improvement: +{pr.improvement} kg</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 