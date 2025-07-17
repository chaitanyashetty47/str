"use client";

import { useEffect } from "react";
import { useAction } from "@/hooks/useAction";
import { fetchTrainerClientOptions, TrainerClientOption } from "@/actions/trainer-client-options.action";

export function useTrainerClientOptions() {
  const { execute, data, isLoading, error } = useAction(fetchTrainerClientOptions);

  // Lazy-load on mount.
  useEffect(() => {
    execute({} as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    options: (data as TrainerClientOption[]) || [],
    isLoading,
    error,
    reload: () => execute({} as any),
  };
} 