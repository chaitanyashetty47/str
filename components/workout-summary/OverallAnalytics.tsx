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
import { 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Activity, 
  Target,
  Users,
  Dumbbell
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  OverallAnalyticsData,
  ExerciseProgressData,
} from "@/actions/client-workout/workout-analytics.action";
import { useOverallAnalytics } from "@/hooks/use-workout-analytics";

interface OverallAnalyticsProps {
  planId: string;
}

export default function OverallAnalytics({ planId }: OverallAnalyticsProps) {
  const { data, loading, error } = useOverallAnalytics(planId);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  // Set initial selections when data loads
  useEffect(() => {
    if (data && data.exercises.length > 0) {
      const firstExercise = data.exercises[0];
      setSelectedBodyPart(firstExercise.bodyPart);
      setSelectedExerciseId(firstExercise.exerciseId);
    }
  }, [data]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress Analytics</CardTitle>
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
          <CardTitle>Overall Progress Analytics</CardTitle>
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
          <CardTitle>Overall Progress Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No workout progress data available for this plan
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group exercises by body part
  const exercisesByBodyPart = data.exercises.reduce((acc, exercise) => {
    const bodyPart = exercise.bodyPart;
    if (!acc[bodyPart]) {
      acc[bodyPart] = [];
    }
    acc[bodyPart].push(exercise);
    return acc;
  }, {} as Record<string, typeof data.exercises>);

  // Get available body parts (sorted)
  const availableBodyParts = Object.keys(exercisesByBodyPart).sort();

  // Get exercises for selected body part
  const bodyPartExercises = selectedBodyPart ? exercisesByBodyPart[selectedBodyPart] || [] : [];
  
  // Get current exercise
  const currentExercise = bodyPartExercises.find(ex => ex.exerciseId === selectedExerciseId) || bodyPartExercises[0];

  // Handler for body part selection
  const handleBodyPartChange = (bodyPart: string) => {
    setSelectedBodyPart(bodyPart);
    const exercises = exercisesByBodyPart[bodyPart];
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
          <CardTitle>Overall Progress Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No exercise data available for the selected filters
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data for current exercise - filter out weeks with no data
  const chartData = currentExercise.weeklyORMs
    .filter(week => week.bestORM !== null)
    .map((week) => ({
      week: `Week ${week.weekNumber}`,
      weekNumber: week.weekNumber,
      orm: week.bestORM || 0,
      date: new Date(week.weekDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
    }));

  // Calculate improvement stats
  const firstORM = chartData[0]?.orm || 0;
  const lastORM = chartData[chartData.length - 1]?.orm || 0;
  const totalImprovement = lastORM - firstORM;
  const improvementPercentage = firstORM > 0 ? ((totalImprovement / firstORM) * 100) : 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">{data.date}</p>
          <p className="text-sm font-medium text-strentor-red">
            Best ORM: {data.orm} kg
          </p>
        </div>
      );
    }
    return null;
  };

  // Group PRs by body part for better visualization
  const prsByBodyPart = data.planPRs.reduce((acc, pr) => {
    const exercise = data.exercises.find(ex => ex.exerciseId === pr.exerciseId);
    const bodyPart = exercise?.bodyPart || 'OTHER';
    
    if (!acc[bodyPart]) {
      acc[bodyPart] = [];
    }
    acc[bodyPart].push(pr);
    return acc;
  }, {} as Record<string, typeof data.planPRs>);

  const bodyPartColors: Record<string, string> = {
    CHEST: "bg-red-100 text-red-800",
    BACK: "bg-blue-100 text-blue-800", 
    SHOULDERS: "bg-yellow-100 text-yellow-800",
    BICEPS: "bg-purple-100 text-purple-800",
    TRICEPS: "bg-pink-100 text-pink-800",
    LEGS: "bg-green-100 text-green-800",
    CORE: "bg-orange-100 text-orange-800",
    CARDIO: "bg-indigo-100 text-indigo-800",
    FULL_BODY: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      {/* Overall Plan Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-strentor-red" />
              Overall Progress Analytics
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{data.exercises.length} exercises tracked</span>
              <span>{data.totalPRsAchieved} PRs achieved</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* PR Summary by Body Part */}
          {Object.keys(prsByBodyPart).length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                Personal Records by Body Part
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(prsByBodyPart).map(([bodyPart, prs]) => (
                  <div
                    key={bodyPart}
                    className={`p-3 rounded-lg text-center ${
                      bodyPartColors[bodyPart] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-lg font-bold">{prs.length}</p>
                    <p className="text-xs capitalize">
                      {bodyPart.toLowerCase().replace('_', ' ')} PRs
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body Part and Exercise Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Body Part Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-strentor-red" />
                Select Body Part
              </label>
              <Select value={selectedBodyPart} onValueChange={handleBodyPartChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a body part..." />
                </SelectTrigger>
                <SelectContent>
                  {availableBodyParts.map((bodyPart) => {
                    const exerciseCount = exercisesByBodyPart[bodyPart].length;
                    const formattedBodyPart = bodyPart.toLowerCase().replace('_', ' ');
                    return (
                      <SelectItem key={bodyPart} value={bodyPart}>
                        {formattedBodyPart.charAt(0).toUpperCase() + formattedBodyPart.slice(1)} ({exerciseCount} exercises)
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
                  {bodyPartExercises.map((exercise) => (
                    <SelectItem key={exercise.exerciseId} value={exercise.exerciseId}>
                      {exercise.exerciseName}
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
              {currentExercise.bodyPart.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>

          {/* Exercise Progress Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-strentor-red">
                {currentExercise.bestOverallORM || 0}
              </p>
              <p className="text-sm text-muted-foreground">Peak ORM (kg)</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className={`text-2xl font-bold ${totalImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalImprovement >= 0 ? '+' : ''}{totalImprovement.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">Total Gain (kg)</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className={`text-2xl font-bold ${improvementPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {improvementPercentage >= 0 ? '+' : ''}{improvementPercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Improvement</p>
            </div>
          </div>

          {/* Progress Line Chart */}
          {chartData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
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
                    dataKey="week"
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
                  
                  {/* Trend line */}
                  <Line
                    type="monotone"
                    dataKey="orm"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: "#ef4444", strokeWidth: 2 }}
                  />
                  
                  {/* Starting point reference line */}
                  {firstORM > 0 && (
                    <ReferenceLine
                      y={firstORM}
                      stroke="#94a3b8"
                      strokeDasharray="5 5"
                      label={{ value: "Starting Point", position: "topLeft" }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No progress data available</p>
                <p className="text-sm">Start logging workouts to see trends!</p>
              </div>
            </div>
          )}

          {/* Progress Insights */}
          {chartData.length > 1 && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-strentor-red" />
                Progress Insights for {currentExercise.exerciseName}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">
                    <strong>Best Performance:</strong> {currentExercise.bestOverallORM} kg
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Weeks with Data:</strong> {chartData.length} weeks
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    <strong>Latest ORM:</strong> {lastORM} kg
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Average Weekly Gain:</strong> {
                      chartData.length > 1 
                        ? (totalImprovement / (chartData.length - 1)).toFixed(1)
                        : '0'
                    } kg
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 