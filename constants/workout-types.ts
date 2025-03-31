// All available body parts
export const BODY_PARTS = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  legs: "Legs",
  quads: "Quadriceps",
  hamstrings: "Hamstrings",
  calves: "Calves",
  core: "Core",
  fullbody: "Full Body",
  cardio: "Cardio"
} as const;

export type BodyPart = keyof typeof BODY_PARTS;

// Common workout combinations (templates)
export const WORKOUT_TEMPLATES = {
  "chest_triceps": "Chest & Triceps",
  "back_biceps": "Back & Biceps",
  "legs": "Legs",
  "upper_body": "Upper Body",
  "lower_body": "Lower Body",
  "push": "Push (Chest, Shoulders, Triceps)",
  "pull": "Pull (Back, Biceps)",
  "full_body": "Full Body"
} as const;

export type WorkoutTemplate = keyof typeof WORKOUT_TEMPLATES;

// Delimiter for storing multiple body parts
export const BODY_PART_DELIMITER = ",";

// Helper functions for working with body part selections
export function parseBodyParts(value: string): BodyPart[] {
  if (!value) return [];
  console.log("value: ", value);
  return value.split(BODY_PART_DELIMITER) as BodyPart[];
}

export function stringifyBodyParts(parts: BodyPart[]): string {
  return parts.join(BODY_PART_DELIMITER);
}

// Check if a workout type selection is valid
export function isValidBodyPartSelection(parts: BodyPart[]): boolean {
  return parts.length > 0 && parts.every(part => part in BODY_PARTS);
}

// Get display name for a body part combo
export function getBodyPartDisplayName(value: string): string {
  // First check if the value is a pre-defined template
  if (value in WORKOUT_TEMPLATES) {
    return WORKOUT_TEMPLATES[value as WorkoutTemplate];
  }
  
  const parts = parseBodyParts(value);
  
  if (parts.length === 0) return "Not specified";
  
  console.log("parts: ", parts);
  return parts.map(part => {
    // Check if part exists in BODY_PARTS
    if (part in BODY_PARTS) {
      return BODY_PARTS[part as BodyPart];
    }
    // Check if it's a template with underscores instead of commas
    const withUnderscores = part.replace(/[,]/g, '_');
    if (withUnderscores in WORKOUT_TEMPLATES) {
      return WORKOUT_TEMPLATES[withUnderscores as WorkoutTemplate];
    }
    // Fall back to capitalized version of the part
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" & ");
} 