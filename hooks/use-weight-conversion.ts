import { useState, useEffect } from "react";
import { WeightUnit } from "@prisma/client";
import { convertFromKg } from "@/utils/weight";
import { getWeightUnit } from "@/actions/profile/get-weight-unit.action";

interface WeightConversionHook {
  userWeightUnit: WeightUnit;
  convertWeightForDisplay: (weightInKg: number | null) => string;
  getWeightUnitLabel: () => string;
  isLoading: boolean;
}

/**
 * Hook to get user's weight unit preference and provide conversion utilities
 * @param initialWeightUnit - Optional weight unit to avoid server call if already known
 */
export function useWeightConversion(initialWeightUnit?: WeightUnit): WeightConversionHook {
  const [userWeightUnit, setUserWeightUnit] = useState<WeightUnit>(
    initialWeightUnit || WeightUnit.KG
  );
  const [isLoading, setIsLoading] = useState(!initialWeightUnit);

  useEffect(() => {
    // Skip server call if initial weight unit is provided
    if (initialWeightUnit) {
      setIsLoading(false);
      return;
    }

    // Fetch user's weight unit preference using server action
    async function fetchWeightUnit() {
      try {
        const weightUnit = await getWeightUnit();
        setUserWeightUnit(weightUnit);
      } catch (error) {
        console.error('Failed to fetch weight unit preference:', error);
        // Default to KG if fetch fails
        setUserWeightUnit(WeightUnit.KG);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWeightUnit();
  }, [initialWeightUnit]);

  const convertWeightForDisplay = (weightInKg: number | null): string => {
    if (!weightInKg) return "";
    const convertedWeight = convertFromKg(weightInKg, userWeightUnit);
    return convertedWeight.toFixed(1);
  };

  const getWeightUnitLabel = (): string => {
    return userWeightUnit === WeightUnit.KG ? "kg" : "lbs";
  };

  return {
    userWeightUnit,
    convertWeightForDisplay,
    getWeightUnitLabel,
    isLoading,
  };
} 