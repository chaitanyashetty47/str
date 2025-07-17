import { useState, useCallback } from 'react';

export type WeightUnit = 'kg' | 'lb';

interface UseWeightConversionReturn {
  preferredUnit: WeightUnit;
  setPreferredUnit: (unit: WeightUnit) => void;
  convertToKg: (weight: number, fromUnit: WeightUnit) => number;
  convertFromKg: (weightKg: number, toUnit: WeightUnit) => number;
  formatWeight: (weightKg: number, unit?: WeightUnit) => string;
  parseWeight: (input: string, fromUnit: WeightUnit) => number;
}

/**
 * Hook for weight conversion between kg and lb
 * Always stores weights in kg in the database
 * Converts for display based on user preference
 */
export function useWeightConversion(defaultUnit: WeightUnit = 'kg'): UseWeightConversionReturn {
  const [preferredUnit, setPreferredUnit] = useState<WeightUnit>(defaultUnit);

  const convertToKg = useCallback((weight: number, fromUnit: WeightUnit): number => {
    if (fromUnit === 'kg') return weight;
    // Convert from lb to kg (1 lb = 0.453592 kg)
    return weight * 0.453592;
  }, []);

  const convertFromKg = useCallback((weightKg: number, toUnit: WeightUnit): number => {
    if (toUnit === 'kg') return weightKg;
    // Convert from kg to lb (1 kg = 2.20462 lb)
    return weightKg * 2.20462;
  }, []);

  const formatWeight = useCallback((weightKg: number, unit?: WeightUnit): string => {
    const targetUnit = unit || preferredUnit;
    const convertedWeight = convertFromKg(weightKg, targetUnit);
    
    if (targetUnit === 'kg') {
      return `${convertedWeight.toFixed(1)}kg`;
    } else {
      return `${convertedWeight.toFixed(1)}lb`;
    }
  }, [preferredUnit, convertFromKg]);

  const parseWeight = useCallback((input: string, fromUnit: WeightUnit): number => {
    const numericValue = parseFloat(input);
    if (isNaN(numericValue)) return 0;
    return convertToKg(numericValue, fromUnit);
  }, [convertToKg]);

  return {
    preferredUnit,
    setPreferredUnit,
    convertToKg,
    convertFromKg,
    formatWeight,
    parseWeight,
  };
}

// Utility functions for direct conversion (no hook needed)
export const weightUtils = {
  kgToLb: (kg: number): number => kg * 2.20462,
  lbToKg: (lb: number): number => lb * 0.453592,
  formatKg: (kg: number): string => `${kg.toFixed(1)}kg`,
  formatLb: (kg: number): string => `${(kg * 2.20462).toFixed(1)}lb`,
}; 