import { IntensityMode, WeightUnit } from "@prisma/client";

/**
 * Returns a user-friendly weight string for set display.
 *
 *  - ABSOLUTE → "80 kg" (or "80 lb" once unit support added)
 *  - PERCENT  → "75 % → 90 kg" when oneRM present, otherwise "75 %"
 */
export function getDisplayWeight(
  intensity: number,
  mode: IntensityMode,
  oneRM?: number,
  weightUnit: WeightUnit = WeightUnit.KG,
): string {
  const unitLabel = weightUnit === WeightUnit.KG ? "kg" : "lbs";
  
  if (mode === IntensityMode.ABSOLUTE) return `${intensity} ${unitLabel}`;
  if (oneRM) {
    const absWeightInKg = (intensity * oneRM) / 100;
    const displayWeight = convertFromKg(absWeightInKg, weightUnit);
    return `${intensity}% → ${displayWeight.toFixed(1)} ${unitLabel}`;
  }
  return `${intensity}%`;
}

// ────────────────────────────────────────────────────────────────────────────
// Weight conversion utilities - shared between create and update actions
// ────────────────────────────────────────────────────────────────────────────
export const weightUtils = {
  kgToLb: (kg: number): number => kg * 2.20462,
  lbToKg: (lb: number): number => lb * 0.453592,
};

export function convertToKg(weight: number, fromUnit: WeightUnit): number {
  if (fromUnit === WeightUnit.KG) return weight;
  return weightUtils.lbToKg(weight);
}

export function convertFromKg(weightInKg: number, toUnit: WeightUnit): number {
  if (toUnit === WeightUnit.KG) return weightInKg;
  return weightUtils.kgToLb(weightInKg);
}

// TODO: Support imperial units once user/unit preference is introduced.
