"use client";

import { useState, useEffect } from "react";
import type { TrainerClientOption } from "@/actions/trainer-clients/trainer-client-options.action";

// Singleton cache with promise deduplication
let cachedOptions: TrainerClientOption[] | undefined;
let fetchPromise: Promise<TrainerClientOption[]> | undefined;

async function fetchTrainerClientOptions(): Promise<TrainerClientOption[]> {
  // Return cached data immediately if available
  if (cachedOptions) {
    return cachedOptions;
  }

  // Return existing promise if already fetching (prevents duplicate requests)
  if (fetchPromise) {
    return fetchPromise;
  }

  // Create new fetch promise
  fetchPromise = (async () => {
    const res = await fetch("/api/trainer-client-options");
    if (!res.ok) {
      throw new Error("Failed to load clients");
    }
    const data: TrainerClientOption[] = await res.json();
    cachedOptions = data; // Cache the result
    fetchPromise = undefined; // Clear promise after completion
    return data;
  })();

  return fetchPromise;
}

export function useTrainerClientOptions() {
  const [options, setOptions] = useState<TrainerClientOption[]>(() => cachedOptions ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedOptions);
  const [error, setError] = useState<string | undefined>();

  const loadData = async () => {
    try {
      const data = await fetchTrainerClientOptions();
      setOptions(data);
      setIsLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if not already cached
    if (!cachedOptions) {
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