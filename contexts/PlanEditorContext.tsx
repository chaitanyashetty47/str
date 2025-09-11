"use client";
import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import { type PlanEditorState, type WeekInPlan, type DayInPlan, PlanEditorMeta } from "@/types/workout-plans-create/editor-state";
import { WorkoutCategory, WorkoutPlanStatus, WeightUnit } from "@prisma/client";
import { ExerciseInPlan, SetInPlan } from "@/types/workout-plans-create/editor-state";
import { v4 as uuidv4 } from "uuid";
import { produce } from "immer";
import { IntensityMode } from "@prisma/client";
import { 
  validateExerciseSet, 
  validateExercise, 
  type ExerciseValidationError, 
  type SetValidationError, 
  type ValidationSummary 
} from "@/lib/schemas/plan-validation";
import { startOfWeek } from "date-fns";

// ------------------------------------------------------------------
// Action types (expand incrementally)
// ------------------------------------------------------------------
export type PlanEditorAction =
  | { type: "ADD_WEEK" }
  | { type: "SELECT_WEEK_DAY"; week: number; day: 1 | 2 | 3 | 4 | 5 | 6 | 7 }
  | { type: "DUPLICATE_WEEK"; week: number}
  | { type: "DELETE_WEEK"; week: number}
  | { type: "ADD_DAY"; week: number }
  | { type: "DELETE_DAY"; week: number; day: number }
  | { type: "UPDATE_META"; payload: Partial<PlanEditorMeta>}
  | {type: "SET_STATUS"; status: WorkoutPlanStatus}
  | {type: "TOGGLE_INTENSITY_MODE"}
  | {type: "RENAME_DAY"; week: number; day: number; newName: string}
  | {type: "ADD_EXERCISE"; week: number; day: number; exercise: ExerciseInPlan}
  | {type: "DELETE_EXERCISE"; week: number; day: number; exercise: ExerciseInPlan}
  | {type: "REORDER_EXERCISE"; week: number; day: number; activeUid: string; overUid: string}
  | {type: "ADD_SET"; week: number; day: number; exercise: ExerciseInPlan}
  | {type: "DELETE_SET"; week: number; day: number; uid: string; set: number }
  | {type: "UPDATE_SET_FIELD";
      week: number;
      day: number;
      uid: string;      // exercise uid
      set: number;      // setNumber (1-based)
      field: "weight" | "reps" | "rest" | "notes";
      value: string | number;
    }
  | {type: "UPDATE_EXERCISE_FIELD";
      week: number;
      day: number;
      uid: string;      // exercise uid
      field: "instructions" | "notes";
      value: string;
    }

  //Future action
//   ADD_EXERCISE            // inserts ExerciseInPlan
// DELETE_EXERCISE
// REORDER_EXERCISE        // via drag-and-drop

// ADD_SET
// DELETE_SET
// UPDATE_SET_FIELD        // weight/reps/rest/notes
// TOGGLE_PLAN_INTENSITY   // 'ABS' ↔ 'PERCENT'

// ------------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------------
function createBlankWeek(weekNumber: number): WeekInPlan {
  const days: DayInPlan[] = [
    { dayNumber: 1, title: "Training Day 1", exercises: [], estimatedTimeMinutes: 0 },
    { dayNumber: 2, title: "Training Day 2", exercises: [], estimatedTimeMinutes: 0 },
    { dayNumber: 3, title: "Training Day 3", exercises: [], estimatedTimeMinutes: 0 },
  ];

  return { weekNumber, days };
}

// Check if a week can have more days added (max 7 days)
function canAddDay(week: WeekInPlan): boolean {
  return week.days.length < 7;
}

// Check if a week can have days deleted (min 3 days)
function canDeleteDay(week: WeekInPlan): boolean {
  return week.days.length > 3;
}

// Get the next day number for a week
function getNextDayNumber(week: WeekInPlan): number {
  if (week.days.length === 0) return 1;
  return Math.max(...week.days.map(d => d.dayNumber)) + 1;
}

// Calculate total days across all weeks
function getTotalDays(weeks: WeekInPlan[]): number {
  return weeks.reduce((total, week) => total + week.days.length, 0);
}


 


// ------------------------------------------------------------------
// Reducer (currently just returns state; will be filled later)
// ------------------------------------------------------------------
// Helper to create a deep copy of a week with new UIDs for exercises
function duplicateWeek(week: WeekInPlan, newWeekNumber: number): WeekInPlan {
  return {
    ...week,
    weekNumber: newWeekNumber,
    days: week.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => ({
        ...exercise,
        uid: uuidv4(), // Generate new UID for React list stability
        sets: exercise.sets.map((set) => ({ ...set })), // Deep copy sets
      })),
    })) as [DayInPlan, DayInPlan, DayInPlan],
  };
}

function reducer(state: PlanEditorState, action: PlanEditorAction): PlanEditorState {
  return produce(state, (draft) => {
    switch (action.type) {
      case "ADD_WEEK": {
        const newWeek = createBlankWeek(draft.weeks.length + 1);
        draft.weeks.push(newWeek);
        draft.meta.durationWeeks = draft.weeks.length; // Update durationWeeks
        break;
      }

      case "UPDATE_META": {
        draft.meta = { ...draft.meta, ...action.payload };
        break;
      }

      case "SELECT_WEEK_DAY": {
        draft.selectedWeek = action.week;
        draft.selectedDay = action.day;
        break;
      }

      case "DELETE_WEEK": {
        // Find the index of the week to delete
        const weekIndex = draft.weeks.findIndex((w) => w.weekNumber === action.week);
        if (weekIndex === -1) break; // Week not found

        // Remove the week
        draft.weeks.splice(weekIndex, 1);

        // Renumber subsequent weeks
        for (let i = weekIndex; i < draft.weeks.length; i++) {
          draft.weeks[i].weekNumber = i + 1;
        }

        // Update durationWeeks
        draft.meta.durationWeeks = draft.weeks.length;

        // Adjust selectedWeek/selectedDay if the deleted week was selected
        if (draft.selectedWeek === action.week) {
          if (draft.weeks.length > 0) {
            draft.selectedWeek = Math.min(action.week, draft.weeks.length);
            draft.selectedDay = 1;
          } else {
            draft.selectedWeek = 1;
            draft.selectedDay = 1;
          }
        } else if (draft.selectedWeek > action.week) {
          draft.selectedWeek -= 1; // Shift selectedWeek down
        }
        break;
      }

      case "ADD_DAY": {
        // Find the target week
        const week = draft.weeks.find((w) => w.weekNumber === action.week);
        if (!week) break; // Week not found

        // Check if we can add more days (max 7)
        if (!canAddDay(week)) break; // Already at max days

        // Get the next day number
        const nextDayNumber = getNextDayNumber(week);

        // Create new day
        const newDay: DayInPlan = {
          dayNumber: nextDayNumber as 1 | 2 | 3 | 4 | 5 | 6 | 7,
          title: `Training Day ${nextDayNumber}`,
          exercises: [],
          estimatedTimeMinutes: 0,
        };

        // Add the new day
        week.days.push(newDay);

        // Auto-select the newly added day
        draft.selectedWeek = action.week;
        draft.selectedDay = nextDayNumber as 1 | 2 | 3 | 4 | 5 | 6 | 7;
        break;
      }

      case "DELETE_DAY": {
        // Find the target week
        const week = draft.weeks.find((w) => w.weekNumber === action.week);
        if (!week) break; // Week not found

        // Check if we can delete days (min 3 days)
        if (!canDeleteDay(week)) break; // Already at minimum days

        // Find the day to delete
        const dayIndex = week.days.findIndex((d) => d.dayNumber === action.day);
        if (dayIndex === -1) break; // Day not found

        // Remove the day
        week.days.splice(dayIndex, 1);

        // Adjust selectedDay if the deleted day was selected
        if (draft.selectedWeek === action.week && draft.selectedDay === action.day) {
          // Select the first available day in the week
          if (week.days.length > 0) {
            draft.selectedDay = week.days[0].dayNumber;
          } else {
            draft.selectedDay = 1; // Fallback
          }
        }
        break;
      }

      case "DUPLICATE_WEEK": {
        // Find the week to duplicate
        const weekIndex = draft.weeks.findIndex((w) => w.weekNumber === action.week);
        if (weekIndex === -1) break; // Week not found

        // Create a duplicate with new weekNumber and UIDs
        const duplicatedWeek = duplicateWeek(draft.weeks[weekIndex], weekIndex + 2);

        // Insert the duplicate after the original week
        draft.weeks.splice(weekIndex + 1, 0, duplicatedWeek);

        // Renumber subsequent weeks
        for (let i = weekIndex + 2; i < draft.weeks.length; i++) {
          draft.weeks[i].weekNumber = i + 1;
        }

        // Update durationWeeks
        draft.meta.durationWeeks = draft.weeks.length;
        break;
      }

      case "RENAME_DAY": {
        const week = draft.weeks.find((w) => w.weekNumber === action.week);
        if (!week) break;

        const day = week.days.find((d) => d.dayNumber === action.day);
        if (!day) break;

        day.title = action.newName;
        break;
      }

      case "ADD_EXERCISE": {
        const week = draft.weeks.find((w) => w.weekNumber === action.week);
        if (!week) break;
        const day = week.days.find((d) => d.dayNumber === action.day);
        if (!day) break;
        const newExercise = {
          ...action.exercise,
          order: day.exercises.length + 1,
          sets:
            action.exercise.sets.length > 0
              ? action.exercise.sets
              : [
                  {
                    setNumber: 1,
                    weight: action.exercise.isRepsBased ? "" : "", // Empty for both types initially
                    reps: "",
                    rest: 60,  // Default to 60 seconds instead of 0
                    notes: "",
                  },
                ],
        };
        day.exercises.push(newExercise);
        break;
      }

      case "DELETE_EXERCISE": {
        const week = draft.weeks.find((w) => w.weekNumber === action.week);
        if (!week) break;
        const day = week.days.find((d) => d.dayNumber === action.day);
        if (!day) break;
        day.exercises = day.exercises.filter((e) => e.uid !== action.exercise.uid);
        break;
      }

      case "REORDER_EXERCISE": {
        const { week, day, activeUid, overUid } = action as any;
        const wk = draft.weeks.find((w) => w.weekNumber === week);
        if (!wk) break;
        const dy = wk.days.find((d) => d.dayNumber === day);
        if (!dy) break;
        const oldIndex = dy.exercises.findIndex((e) => e.uid === activeUid);
        const newIndex = dy.exercises.findIndex((e) => e.uid === overUid);
        if (oldIndex === -1 || newIndex === -1) break;
        // @ts-ignore
        const { arrayMove } = require("@dnd-kit/sortable");
        dy.exercises = arrayMove(dy.exercises, oldIndex, newIndex);
        dy.exercises.forEach((e, idx) => (e.order = idx + 1));
        break;
      }

      case "ADD_SET": {
        const week = draft.weeks.find((w) => w.weekNumber === action.week);
        if (!week) break;
        const day = week.days.find((d) => d.dayNumber === action.day);
        if (!day) break;
        const exercise = day.exercises.find((e) => e.uid === action.exercise.uid);
        if (!exercise) break;
        
        // Smart set duplication - copy values from previous set
        const lastSet = exercise.sets[exercise.sets.length - 1];
        exercise.sets.push({
          setNumber: exercise.sets.length + 1,
          weight: lastSet?.weight || "",        // Copy previous weight or empty
          reps: lastSet?.reps || "",            // Copy previous reps or empty
          rest: lastSet?.rest || 60,            // Copy previous rest or default 60
          notes: "",                            // Keep notes empty (set-specific)
        });
        break;
      }

      case "DELETE_SET": {
        const { week, day, uid, set } = action;
        const wk = draft.weeks.find((w) => w.weekNumber === week);
        if (!wk) break;
        const dy = wk.days.find((d) => d.dayNumber === day);
        if (!dy) break;
        const ex = dy.exercises.find((e) => e.uid === uid);
        if (!ex) break;
        if (ex.sets.length === 1) break; // enforce at least one set
        ex.sets = ex.sets.filter((s) => s.setNumber !== set);
        // renumber
        ex.sets.forEach((s, idx) => (s.setNumber = idx + 1));
        break;
      }

      case "UPDATE_SET_FIELD": {
        const { week, day, uid, set, field, value } = action;
        const weekObj = draft.weeks.find((w) => w.weekNumber === week);
        if (!weekObj) break;
        const dayObj = weekObj.days.find((d) => d.dayNumber === day);
        if (!dayObj) break;
        const ex = dayObj.exercises.find((e) => e.uid === uid);
        if (!ex) break;
        const targetSet = ex.sets.find((s) => s.setNumber === set);
        if (!targetSet) break;
        // @ts-ignore – dynamic field
        targetSet[field] = value;
        break;
      }

      case "UPDATE_EXERCISE_FIELD": {
        const { week, day, uid, field, value } = action;
        const weekObj = draft.weeks.find((w) => w.weekNumber === week);
        if (!weekObj) break;
        const dayObj = weekObj.days.find((d) => d.dayNumber === day);
        if (!dayObj) break;
        const ex = dayObj.exercises.find((e) => e.uid === uid);
        if (!ex) break;
        // @ts-ignore – dynamic field
        ex[field] = value;
        break;
      }

      case "TOGGLE_INTENSITY_MODE": {
        draft.meta.intensityMode =
          draft.meta.intensityMode === IntensityMode.ABSOLUTE ? IntensityMode.PERCENT : IntensityMode.ABSOLUTE;
        break;
      }

      case "SET_STATUS": {
        draft.meta.status = action.status;
        break;
      }

      default:
        break;
    }
  });
  
}

// ------------------------------------------------------------------
// Contexts – split to minimise unnecessary re-renders
// ------------------------------------------------------------------
const StateCtx = createContext<PlanEditorState | undefined>(undefined);
const DispatchCtx = createContext<React.Dispatch<PlanEditorAction> | undefined>(undefined);
const WeightUnitCtx = createContext<WeightUnit | undefined>(undefined);

// ------------------------------------------------------------------
// Provider with temporary hard-coded initial state
// ------------------------------------------------------------------
const initialState: PlanEditorState = {
  meta: {
    title: "New Routine",
    description: "",
    startDate: startOfWeek(new Date(), { weekStartsOn: 1 }), // Always start on Monday of current week
    category: WorkoutCategory.HYPERTROPHY, // temp placeholder – cast for now
    clientId: "",
    durationWeeks: 1,
    intensityMode: IntensityMode.ABSOLUTE,
    status: WorkoutPlanStatus.DRAFT,
    weightUnit: WeightUnit.KG, // Default weight unit
  },
  weeks: [createBlankWeek(1)],
  selectedWeek: 1,
  selectedDay: 1,
};

interface PlanEditorProviderProps {
  children: ReactNode;
  initial?: PlanEditorState;
  trainerWeightUnit?: WeightUnit;
  selectedClientId?: string;
}

export function PlanEditorProvider({ children, initial, trainerWeightUnit, selectedClientId }: PlanEditorProviderProps) {
  // Create initial state with selectedClientId if provided
  const initialStateWithClient: PlanEditorState = {
    ...initialState,
    meta: {
      ...initialState.meta,
      clientId: selectedClientId || "",
    },
  };

  const [state, dispatch] = useReducer(reducer, initial ?? initialStateWithClient);
  const weightUnit = trainerWeightUnit ?? WeightUnit.KG;
  
  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>
        <WeightUnitCtx.Provider value={weightUnit}>
          {children}
        </WeightUnitCtx.Provider>
      </DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

// ------------------------------------------------------------------
// Validation Helper Functions
// ------------------------------------------------------------------
export function validateAllSets(state: PlanEditorState): ValidationSummary {
  const exerciseErrors: ExerciseValidationError[] = [];
  let totalErrors = 0;

  state.weeks.forEach((week) => {
    week.days.forEach((day) => {
      day.exercises.forEach((exercise) => {
        const validation = validateExercise({
          uid: exercise.uid,
          listExerciseId: exercise.listExerciseId,
          name: exercise.name,
          instructions: exercise.instructions,
          sets: exercise.sets.map(set => ({
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
            rest: set.rest,
            notes: set.notes,
          })),
        });

        if (!validation.isValid) {
          exerciseErrors.push({
            uid: exercise.uid,
            name: exercise.name,
            weekNumber: week.weekNumber,
            dayNumber: day.dayNumber,
            errors: validation.errors,
            setErrors: validation.setErrors,
          });
          totalErrors += validation.errors.length + validation.setErrors.length;
        }
      });
    });
  });

  return {
    isValid: exerciseErrors.length === 0,
    planHeaderErrors: {}, // This will be populated by plan header validation
    exerciseErrors,
    totalErrors,
  };
}

export function getSetValidationErrors(state: PlanEditorState): Map<string, SetValidationError[]> {
  const setErrorsMap = new Map<string, SetValidationError[]>();

  state.weeks.forEach((week) => {
    week.days.forEach((day) => {
      day.exercises.forEach((exercise) => {
        const exerciseSetErrors: SetValidationError[] = [];

        exercise.sets.forEach((set) => {
          const setValidation = validateExerciseSet({
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
            rest: set.rest,
            notes: set.notes,
          });

          if (!setValidation.isValid) {
            exerciseSetErrors.push({
              exerciseUid: exercise.uid,
              exerciseName: exercise.name,
              setNumber: set.setNumber,
              errors: setValidation.errors,
            });
          }
        });

        if (exerciseSetErrors.length > 0) {
          setErrorsMap.set(exercise.uid, exerciseSetErrors);
        }
      });
    });
  });

  return setErrorsMap;
}

export function hasValidationErrors(state: PlanEditorState): boolean {
  return !validateAllSets(state).isValid;
}

export function getExerciseValidationStatus(exercise: ExerciseInPlan): {
  isValid: boolean;
  hasEmptySets: boolean;
  emptySetNumbers: number[];
} {
  const emptySetNumbers: number[] = [];
  let hasEmptySets = false;

  exercise.sets.forEach((set) => {
    // For reps-based exercises, weight is not required
    const isWeightValid = exercise.isRepsBased || set.weight;
    if (!isWeightValid || !set.reps || set.rest < 0) {
      hasEmptySets = true;
      emptySetNumbers.push(set.setNumber);
    }
  });

  return {
    isValid: !hasEmptySets && exercise.sets.length > 0,
    hasEmptySets,
    emptySetNumbers,
  };
}

// ------------------------------------------------------------------
// Hooks – throw helpful error if mis-used outside provider
// ------------------------------------------------------------------
export function usePlanState() {
  const ctx = useContext(StateCtx);
  if (!ctx) throw new Error("usePlanState must be inside PlanEditorProvider");
  return ctx;
}
export function usePlanDispatch() {
  const ctx = useContext(DispatchCtx);
  if (!ctx) throw new Error("usePlanDispatch must be inside PlanEditorProvider");
  return ctx;
}

export function usePlanWeightUnit() {
  const ctx = useContext(WeightUnitCtx);
  if (!ctx) throw new Error("usePlanWeightUnit must be inside PlanEditorProvider");
  return ctx;
}

// ------------------------------------------------------------------
// Convenience hook for components that only need meta & helpers
// ------------------------------------------------------------------
export function usePlanMeta() {
  const state = usePlanState();
  const dispatch = usePlanDispatch();
  return {
    meta: state.meta,
    toggleIntensity: () => dispatch({ type: "TOGGLE_INTENSITY_MODE" }),
    setStatus: (status: WorkoutPlanStatus) => dispatch({ type: "SET_STATUS", status }),
  } as const;
}

// ------------------------------------------------------------------
// Validation hook for easy access to validation functions
// ------------------------------------------------------------------
export function usePlanValidation() {
  const state = usePlanState();
  
  return {
    validateAllSets: () => validateAllSets(state),
    getSetValidationErrors: () => getSetValidationErrors(state),
    hasValidationErrors: () => hasValidationErrors(state),
    getExerciseValidationStatus,
  } as const;
}

// ------------------------------------------------------------------
// Helper hook for day management
// ------------------------------------------------------------------
export function usePlanHelpers() {
  const state = usePlanState();
  
  return {
    canAddDay: (weekNumber: number) => {
      const week = state.weeks.find(w => w.weekNumber === weekNumber);
      return week ? canAddDay(week) : false;
    },
    canDeleteDay: (weekNumber: number) => {
      const week = state.weeks.find(w => w.weekNumber === weekNumber);
      return week ? canDeleteDay(week) : false;
    },
    getTotalDays: () => getTotalDays(state.weeks),
    getNextDayNumber: (weekNumber: number) => {
      const week = state.weeks.find(w => w.weekNumber === weekNumber);
      return week ? getNextDayNumber(week) : 1;
    },
  } as const;
} 