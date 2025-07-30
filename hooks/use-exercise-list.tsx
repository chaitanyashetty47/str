"use client";

import { useState, useEffect } from "react";
import type { ExerciseListOption } from "@/actions/exercise_list/exercise-list.action";

// Singleton cache with promise deduplication
let cachedExercises: ExerciseListOption[] | undefined;
let fetchPromise: Promise<ExerciseListOption[]> | undefined;

async function fetchExerciseList(): Promise<ExerciseListOption[]> {
  // Return cached data immediately if available
  if (cachedExercises) {
    return cachedExercises;
  }

  // Return existing promise if already fetching (prevents duplicate requests)
  if (fetchPromise) {
    return fetchPromise;
  }

  // Create new fetch promise
  fetchPromise = (async () => {
    const res = await fetch("/api/exercise-list");
    if (!res.ok) {
      throw new Error("Failed to load exercises");
    }
    const data: ExerciseListOption[] = await res.json();
    cachedExercises = data; // Cache the result
    fetchPromise = undefined; // Clear promise after completion
    return data;
  })();

  return fetchPromise;
}

export function useExerciseList() {
  const [options, setOptions] = useState<ExerciseListOption[]>(() => cachedExercises ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedExercises);
  const [error, setError] = useState<string | undefined>();

  const loadData = async () => {
    try {
      const data = await fetchExerciseList();
      setOptions(data);
      setIsLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if not already cached
    if (!cachedExercises) {
      loadData();
    }
  }, []);

  return {
    options,
    isLoading,
    error,
    reload: loadData,
  };
}