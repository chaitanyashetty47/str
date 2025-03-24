"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ExerciseForm from "./exercise-form";
import { getWorkoutExercises } from "@/actions/workoutplan.action";
import { WorkoutExercise } from "@/types/workout.types";
import { Collapsible } from "@/components/ui/collapsible";

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
        console.log("Workout Exercises: ", data);
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
      className="px-4 py-2"
    >
      Day {day}
    </TabsTrigger>
  ));

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Daily Workouts</h2>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-7 mb-4">{dayTabs}</TabsList>
        
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => (
          <TabsContent key={day} value={day.toString()} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Day {day} Workout</CardTitle>
                <CardDescription>
                  Manage exercises for day {day} of the workout plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading exercises...</div>
                ) : (
                  <>
                    {exercises.length > 0 ? (
                      <div className="space-y-4">
                        {exercises.map((exercise) => (
                          <Collapsible key={exercise.id} className="border rounded-md">
                            <div className="p-4 flex justify-between items-center">
                              <div>
                                <h3 className="font-medium">{exercise.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {exercise.sets} sets × {exercise.reps} reps
                                  {exercise.rest_time ? ` | Rest: ${exercise.rest_time}` : ""}
                                </p>
                              </div>
                              <div className="flex gap-2">
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
                          </Collapsible>
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
                        className="mt-4"
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