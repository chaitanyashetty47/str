import { z } from "zod";
import { WorkoutCategory, IntensityMode, WorkoutPlanStatus } from "@prisma/client";

// ────────────────────────────────────────────────────────────────────────────
// Plan Header Validation Schema
// ────────────────────────────────────────────────────────────────────────────
export const PlanHeaderSchema = z.object({
  title: z
    .string()
    .min(1, "Plan name is required")
    .min(3, "Plan name must be at least 3 characters")
    .max(100, "Plan name must be less than 100 characters"),
  
  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  
  startDate: z
    .date({ 
      required_error: "Start date is required",
      invalid_type_error: "Please select a valid start date"
    }),
  
  durationWeeks: z
    .number()
    .min(1, "Duration must be at least 1 week")
    .max(52, "Duration cannot exceed 52 weeks"),
  
  category: z
    .nativeEnum(WorkoutCategory, { 
      required_error: "Category is required",
      invalid_type_error: "Please select a valid category"
    }),
  
  clientId: z
    .string()
    .min(1, "Client selection is required")
    .uuid("Invalid client selection"),
  
  intensityMode: z.nativeEnum(IntensityMode),
  
  status: z.nativeEnum(WorkoutPlanStatus),
});

export type PlanHeaderFormData = z.infer<typeof PlanHeaderSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Exercise Set Validation Schema
// ────────────────────────────────────────────────────────────────────────────
export const SetValidationSchema = z.object({
  weight: z
    .string()
    .optional()
    .refine((val) => {
      // If weight is provided, it must be a positive number
      if (val && val.length > 0) {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      }
      return true; // Empty string is valid (for reps-based exercises)
    }, "Weight must be a positive number"),
  
  reps: z
    .string()
    .min(1, "Reps is required")
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num > 0;
    }, "Reps must be a positive number"),
  
  rest: z
    .number()
    .min(0, "Rest time cannot be negative")
    .max(1800, "Rest time cannot exceed 30 minutes"),
  
  setNumber: z.number().int().positive(),
  notes: z.string().optional(),
});

export const ExerciseValidationSchema = z.object({
  uid: z.string(),
  listExerciseId: z.string().uuid(),
  name: z.string().min(1, "Exercise name is required"),
  instructions: z.string().optional(),
  sets: z
    .array(SetValidationSchema)
    .min(1, "Each exercise must have at least one set")
    .refine(
      (sets) => sets.every(set => 
        set.reps.length > 0 && 
        set.rest >= 0
        // Weight is optional - can be empty string for reps-based exercises
      ),
      "All sets must have reps and rest time filled"
    ),
});

export type SetValidationData = z.infer<typeof SetValidationSchema>;
export type ExerciseValidationData = z.infer<typeof ExerciseValidationSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Validation Error Types
// ────────────────────────────────────────────────────────────────────────────
export interface SetValidationError {
  exerciseUid: string;
  exerciseName: string;
  setNumber: number;
  errors: {
    weight?: string;
    reps?: string;
    rest?: string;
  };
}

export interface ExerciseValidationError {
  uid: string;
  name: string;
  weekNumber: number;
  dayNumber: number;
  errors: string[];
  setErrors: SetValidationError[];
}

export interface ValidationSummary {
  isValid: boolean;
  planHeaderErrors: Record<string, string>;
  exerciseErrors: ExerciseValidationError[];
  totalErrors: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Validation Helper Functions
// ────────────────────────────────────────────────────────────────────────────
export const validatePlanHeader = (data: any): { isValid: boolean; errors: Record<string, string> } => {
  try {
    PlanHeaderSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: "Validation failed" } };
  }
};

export const validateExerciseSet = (set: any): { isValid: boolean; errors: Record<string, string> } => {
  try {
    SetValidationSchema.parse(set);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: "Set validation failed" } };
  }
};

export const validateExercise = (exercise: any): { isValid: boolean; errors: string[]; setErrors: SetValidationError[] } => {
  const errors: string[] = [];
  const setErrors: SetValidationError[] = [];

  // Validate exercise has at least one set
  if (!exercise.sets || exercise.sets.length === 0) {
    errors.push("Exercise must have at least one set");
    return { isValid: false, errors, setErrors };
  }

  // Validate each set
  exercise.sets.forEach((set: any, index: number) => {
    const setValidation = validateExerciseSet(set);
    if (!setValidation.isValid) {
      setErrors.push({
        exerciseUid: exercise.uid,
        exerciseName: exercise.name,
        setNumber: set.setNumber || index + 1,
        errors: setValidation.errors,
      });
    }
  });

  // Check if exercise name exists
  if (!exercise.name || exercise.name.trim().length === 0) {
    errors.push("Exercise name is required");
  }

  const isValid = errors.length === 0 && setErrors.length === 0;
  return { isValid, errors, setErrors };
};