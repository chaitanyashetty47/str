"use client";

import { useEffect } from "react";
import { useAction } from "@/hooks/useAction";
import { fetchExerciseList, ExerciseListOption } from "@/actions/exercise-list.action";

export function useExerciseList() {
  const { execute, data, isLoading, error } = useAction(fetchExerciseList);

  // Lazy-load on mount.
  useEffect(() => {
    execute({} as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    options: (data as ExerciseListOption[]) || [],
    isLoading,
    error,
    reload: () => execute({} as any),
  };
} 