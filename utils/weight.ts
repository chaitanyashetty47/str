import { IntensityMode } from "@prisma/client";

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
): string {
  if (mode === IntensityMode.ABSOLUTE) return `${intensity} kg`;
  if (oneRM) {
    const abs = (intensity * oneRM) / 100;
    return `${intensity}% → ${abs.toFixed(1)} kg`;
  }
  return `${intensity}%`;
}

// TODO: Support imperial units once user/unit preference is introduced. 