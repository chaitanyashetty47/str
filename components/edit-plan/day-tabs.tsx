"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ExerciseForm from "./exercise-form";
import { getWorkoutExercises } from "@/actions/workoutplan.action";
import { WorkoutExercise } from "@/types/workout.types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DayTabsProps {
  planId: string;
  days: number;
}

export default function DayTabs({ planId, days }: DayTabsProps) {
  const [activeTab, setActiveTab] = useState("1");
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingExercise, setAddingExercise] = useState(false);

  // Fetch exercises when tab changes
  useEffect(() => {
    async function fetchExercises() {
      setLoading(true);
      try {
        const { data, error } = await getWorkoutExercises(planId, parseInt(activeTab));
        if (error) {
          console.error("Error fetching exercises:", error);
        } else {
          setExercises(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch exercises:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchExercises();
  }, [planId, activeTab]);

  const handleAddExercise = () => {
    setAddingExercise(true);
  };

  const handleExerciseSaved = async () => {
    setAddingExercise(false);
    // Refresh exercises
    const { data } = await getWorkoutExercises(planId, parseInt(activeTab));
    setExercises(data || []);
  };

  const handleExerciseDeleted = async () => {
    // Refresh exercises
    const { data } = await getWorkoutExercises(planId, parseInt(activeTab));
    setExercises(data || []);
  };

  const handleCancel = () => {
    setAddingExercise(false);
  };

  // Create day tabs based on the number of days
  const dayTabs = Array.from({ length: days }, (_, i) => i + 1).map((day) => (
    <TabsTrigger
      key={day}
      value={day.toString()}
      className="px-2 sm:px-4 py-2 text-xs sm:text-sm whitespace-nowrap"
    >
      Day {day}
    </TabsTrigger>
  ));

  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-semibold">Daily Workouts</h2>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="pb-2">
          <TabsList className="inline-flex h-auto w-auto p-1 mb-4">
            {dayTabs}
          </TabsList>
        </ScrollArea>
        
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => (
          <TabsContent key={day} value={day.toString()} className="space-y-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle>Day {day} Workout</CardTitle>
                <CardDescription>
                  Manage exercises for day {day} of the workout plan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {loading ? (
                  <div className="text-center py-4">Loading exercises...</div>
                ) : (
                  <>
                    {exercises.length > 0 ? (
                      <div className="space-y-4">
                        {exercises.map((exercise) => (
                          <div key={exercise.id} className="border rounded-md">
                            <div className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
                              <div className="flex-grow">
                                <h3 className="font-medium">{exercise.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {exercise.sets} sets × {exercise.reps} reps
                                  {exercise.weight ? ` | Weight: ${exercise.weight}` : ""}
                                  {exercise.rest_time ? ` | Rest: ${exercise.rest_time}` : ""}
                                </p>
                              </div>
                              <div className="flex gap-2 self-end sm:self-auto">
                                <ExerciseForm
                                  planId={planId}
                                  day={day.toString()}
                                  existingExercise={exercise}
                                  onSaved={handleExerciseSaved}
                                  onDeleted={handleExerciseDeleted}
                                  embedded={true}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border rounded-md bg-muted/50">
                        <p className="text-muted-foreground">No exercises added yet.</p>
                      </div>
                    )}

                    {addingExercise ? (
                      <div className="mt-4">
                        <ExerciseForm
                          planId={planId}
                          day={day.toString()}
                          onSaved={handleExerciseSaved}
                          onCancel={handleCancel}
                        />
                      </div>
                    ) : (
                      <Button 
                        onClick={handleAddExercise} 
                        className="mt-4 w-full sm:w-auto"
                      >
                        Add Exercise
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 