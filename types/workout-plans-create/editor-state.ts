// Plan Editor domain model
// -----------------------------------------------------------
// These purely describe *shape* of data while the plan is being
// built on the client.  Nothing here contains React or UI code.

import { BodyPart, WorkoutCategory, IntensityMode, WorkoutPlanStatus, WeightUnit } from "@prisma/client";

// ─── Per-set information inside an exercise ─────────────────────────
export interface SetInPlan {
  /** 1-based index shown to trainer */
  setNumber: number;
  weight: string;          // allowing "" (empty) during editing
  reps: string;            // same rationale as weight
  rest: number;            // seconds between sets
  notes: string;
}

// ─── Exercise row inside a day ─────────────────────────────────────
export interface ExerciseInPlan {
  /** Local UID so React lists are stable before server save */
  uid: string;
  /** PK of workout_exercise_lists so we can join later */
  listExerciseId: string;
  name: string;
  bodyPart: BodyPart;
  thumbnail: string | null;
  /**
   * Keeping order explicitly allows easy DB write
   * and drag-and-drop reordering without relying on array index.
   */
  order?: number;
  instructions?: string;
  notes?: string; // Exercise-level notes for trainers
  sets: SetInPlan[];
}

// ─── Day inside a week (always 3 per week) ─────────────────────────
export interface DayInPlan {
  dayNumber: 1 | 2 | 3;
  title: string;
  exercises: ExerciseInPlan[];
  /** cached client-side; recomputed when exercises change */
  estimatedTimeMinutes: number;
}

// ─── Week wrapper ──────────────────────────────────────────────────
export interface WeekInPlan {
  weekNumber: number;  // contiguous 1…n
  days: [DayInPlan, DayInPlan, DayInPlan];
}

// ─── Top-level editor state ───────────────────────────────────────
export interface PlanEditorMeta {
  title: string;
  description: string;
  startDate: Date;
  durationWeeks: number;  //need to change it later
  category: WorkoutCategory;
  clientId: string;
  /**
   * Whether set intensities are stored as absolute kg/lb or as percentage of 1-RM.
   */
  intensityMode: IntensityMode;
  /**
   * Workflow status of the plan (draft → published → archived).
   */
  status: WorkoutPlanStatus;
  /**
   * Trainer's weight unit preference (affects input display).
   */
  weightUnit: WeightUnit;
}

export interface PlanEditorState {
  meta: PlanEditorMeta;
  weeks: WeekInPlan[];
  selectedWeek: number;  // 1-based
  selectedDay: 1 | 2 | 3;
}


