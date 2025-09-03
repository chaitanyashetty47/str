/**
 * Converts weight to KG if it's in LB
 */
export function convertToKG(weight: number, unit: 'KG' | 'LB'): number {
  if (unit === 'LB') {
    return weight * 0.453592;
  }
  return weight;
}

/**
 * Converts weight from KG to specified unit
 */
export function convertFromKG(weightKG: number, targetUnit: 'KG' | 'LB'): number {
  if (targetUnit === 'LB') {
    return weightKG * 2.20462;
  }
  return weightKG;
} 