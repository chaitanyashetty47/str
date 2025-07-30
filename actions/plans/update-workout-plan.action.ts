'use server';
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import {
  IntensityMode,
  WorkoutPlanStatus,
  WorkoutCategory,
  BodyPart,
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { addDays, startOfWeek } from "date-fns";

// ────────────────────────────────────────────────────────────────────────────
// Zod schemas (shared with create action)
// ────────────────────────────────────────────────────────────────────────────
const SetSchema = z.object({
  setNumber: z.number().int().positive(),
  weight: z.string(),
  reps: z.string(),
  rest: z.number().nonnegative(),
  notes: z.string(),
});

const ExerciseSchema = z.object({
  uid: z.string(),
  listExerciseId: z.string().uuid(),
  name: z.string(),
  bodyPart: z.nativeEnum(BodyPart),
  thumbnail: z.string().nullable(),
  order: z.number().int().nonnegative().optional(),
  instructions: z.string().optional(),
  sets: z.array(SetSchema).min(1),
});

const DaySchema = z.object({
  dayNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  title: z.string(),
  exercises: z.array(ExerciseSchema),
  estimatedTimeMinutes: z.number().int().nonnegative(),
});

const WeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  days: z.tuple([DaySchema, DaySchema, DaySchema]),
});

const MetaSchema = z.object({
  title: z.string(),
  description: z.string(),
  startDate: z.coerce.date().transform(date => {
    // Ensure we always work with UTC dates at midnight
    const utcDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return utcDate;
  }),
  durationWeeks: z.number().int().positive(),
  category: z.nativeEnum(WorkoutCategory),
  clientId: z.string().uuid(),
  intensityMode: z.nativeEnum(IntensityMode),
  status: z.nativeEnum(WorkoutPlanStatus),
});

const InputSchema = z.object({
  id: z.string().uuid(),
  meta: MetaSchema,
  weeks: z.array(WeekSchema).min(1),
});

export type UpdateWorkoutPlanInput = z.infer<typeof InputSchema>;
export type UpdateWorkoutPlanOutput = { ok: boolean };

// ────────────────────────────────────────────────────────────────────────────
// Helper Types for Diff Operations
// ────────────────────────────────────────────────────────────────────────────
interface ExistingDay {
  id: string;
  week_number: number;
  day_number: number;
  day_date: Date;
  title: string;
  workout_day_exercises: ExistingExercise[];
}

interface ExistingExercise {
  id: string;
  workout_day_id: string;
  list_exercise_id: string;
  instructions: string | null;
  order: number;
  youtube_link: string | null;
  notes: string | null;
  workout_set_instructions: ExistingSet[];
}

interface ExistingSet {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  intensity: IntensityMode | null;
  weight_prescribed: number | null;
  rest_time: number | null;
  notes: string | null;
}

// ────────────────────────────────────────────────────────────────────────────
// Handler with Diff-Based Updates
// ────────────────────────────────────────────────────────────────────────────
async function handler({ id, meta, weeks }: UpdateWorkoutPlanInput) {
  try {
    // meta.startDate is already normalized to UTC midnight by the schema transform
    const mondayStart = startOfWeek(meta.startDate, { weekStartsOn: 1 });
    const endDate = addDays(mondayStart, meta.durationWeeks * 7 - 1);

    await prisma.$transaction(async (tx) => {
      // 1. Update plan meta
      await tx.workout_plans.update({
        where: { id },
        data: {
          title: meta.title,
          description: meta.description,
          start_date: mondayStart,
          end_date: endDate,
          duration_in_weeks: meta.durationWeeks,
          category: meta.category,
          intensity_mode: meta.intensityMode,
          status: meta.status,
        },
      });

      // 2. Get existing structure for comparison
      const existingDays = await tx.workout_days.findMany({
        where: { plan_id: id },
        include: {
          workout_day_exercises: {
            include: {
              workout_set_instructions: true,
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [{ week_number: 'asc' }, { day_number: 'asc' }],
      }) as ExistingDay[];

      // 3. Create lookup maps for existing data
      const existingDaysMap = new Map<string, ExistingDay>();
      const existingExercisesMap = new Map<string, ExistingExercise>();
      const existingSetsMap = new Map<string, ExistingSet>();

      existingDays.forEach(day => {
        const dayKey = `${day.week_number}-${day.day_number}`;
        existingDaysMap.set(dayKey, day);
        
        day.workout_day_exercises.forEach(exercise => {
          existingExercisesMap.set(exercise.id, exercise);
          
          exercise.workout_set_instructions.forEach(set => {
            existingSetsMap.set(set.id, set);
          });
        });
      });

      // 4. Process each week and day from the incoming data
      for (const week of weeks) {
        for (const day of week.days) {
          const dayKey = `${week.weekNumber}-${day.dayNumber}`;
          const existingDay = existingDaysMap.get(dayKey);
          const dayDate = addDays(mondayStart, (week.weekNumber - 1) * 7 + (day.dayNumber - 1));

          if (existingDay) {
            // Update existing day
            await tx.workout_days.update({
              where: { id: existingDay.id },
              data: {
                title: day.title,
                day_date: dayDate,
              },
            });

            // Process exercises for this day
            await processExercisesForDay(tx, existingDay, day.exercises, meta.intensityMode);
          } else {
            // Create new day
            const dayId = uuidv4();
            await tx.workout_days.create({
              data: {
                id: dayId,
                plan_id: id,
                week_number: week.weekNumber,
                day_number: day.dayNumber,
                day_date: dayDate,
                title: day.title,
                workout_day_exercises: {
                  create: day.exercises.map((ex, idx) => ({
                    id: uuidv4(),
                    list_exercise_id: ex.listExerciseId,
                    order: idx + 1,
                    instructions: ex.instructions || "",
                    youtube_link: null,
                    notes: "",
                    workout_set_instructions: {
                      create: ex.sets.map((s) => ({
                        id: uuidv4(),
                        set_number: s.setNumber,
                        reps: s.reps ? parseInt(s.reps, 10) || null : null,
                        intensity: meta.intensityMode,
                        weight_prescribed: s.weight ? parseFloat(s.weight) || null : null,
                        rest_time: s.rest || null,
                        notes: s.notes,
                      })),
                    },
                  })),
                },
              },
            });
          }
        }
      }

      // 5. Handle removed days (soft delete by checking if any logs exist)
      const incomingDayKeys = new Set<string>();
      weeks.forEach(week => {
        week.days.forEach(day => {
          incomingDayKeys.add(`${week.weekNumber}-${day.dayNumber}`);
        });
      });

      for (const [dayKey, existingDay] of existingDaysMap) {
        if (!incomingDayKeys.has(dayKey)) {
          // Check if any exercises in this day have logs
          const hasLogs = await tx.exercise_logs.findFirst({
            where: {
              set_id: {
                in: existingDay.workout_day_exercises.flatMap(ex => 
                  ex.workout_set_instructions.map(set => set.id)
                ),
              },
            },
          });

          if (hasLogs) {
            // Can't delete - has logs. You might want to add a soft delete field
            console.warn(`Cannot delete day ${dayKey} - has exercise logs`);
            // For now, we'll leave it as is. In production, you'd want to:
            // 1. Add an `is_deleted` field to workout_days
            // 2. Set it to true here
            // 3. Filter out deleted days in your queries
          } else {
            // Safe to delete - no logs
            await tx.workout_days.delete({
              where: { id: existingDay.id },
            });
          }
        }
      }
    });

    return { data: { ok: true } };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helper function to process exercises within a day
// ────────────────────────────────────────────────────────────────────────────
async function processExercisesForDay(
  tx: any,
  existingDay: ExistingDay,
  incomingExercises: z.infer<typeof ExerciseSchema>[],
  intensityMode: IntensityMode
) {
  // Create maps for easier lookup
  const existingExercisesMap = new Map<string, ExistingExercise>();
  existingDay.workout_day_exercises.forEach(ex => {
    // Use a composite key of listExerciseId + order for matching
    const key = `${ex.list_exercise_id}-${ex.order}`;
    existingExercisesMap.set(key, ex);
  });

  // Process incoming exercises
  for (let i = 0; i < incomingExercises.length; i++) {
    const exercise = incomingExercises[i];
    const exerciseKey = `${exercise.listExerciseId}-${i + 1}`;
    const existingExercise = existingExercisesMap.get(exerciseKey);

    if (existingExercise) {
      // Update existing exercise
      await tx.workout_day_exercises.update({
        where: { id: existingExercise.id },
        data: {
          list_exercise_id: exercise.listExerciseId,
          order: i + 1,
          instructions: exercise.instructions || "",
          notes: "",
        },
      });

      // Process sets for this exercise
      await processSetsForExercise(tx, existingExercise, exercise.sets, intensityMode);
    } else {
      // Create new exercise
      await tx.workout_day_exercises.create({
        data: {
          id: uuidv4(),
          workout_day_id: existingDay.id,
          list_exercise_id: exercise.listExerciseId,
          order: i + 1,
          instructions: exercise.instructions || "",
          youtube_link: null,
          notes: "",
          workout_set_instructions: {
            create: exercise.sets.map((s) => ({
              id: uuidv4(),
              set_number: s.setNumber,
              reps: s.reps ? parseInt(s.reps, 10) || null : null,
              intensity: intensityMode,
              weight_prescribed: s.weight ? parseFloat(s.weight) || null : null,
              rest_time: s.rest || null,
              notes: s.notes,
            })),
          },
        },
      });
    }
  }

  // Handle removed exercises (check for logs before deletion)
  const incomingExerciseKeys = new Set<string>();
  incomingExercises.forEach((ex, idx) => {
    incomingExerciseKeys.add(`${ex.listExerciseId}-${idx + 1}`);
  });

  for (const [exerciseKey, existingExercise] of existingExercisesMap) {
    if (!incomingExerciseKeys.has(exerciseKey)) {
      // Check if any sets in this exercise have logs
      const hasLogs = await tx.exercise_logs.findFirst({
        where: {
          set_id: {
            in: existingExercise.workout_set_instructions.map(set => set.id),
          },
        },
      });

      if (hasLogs) {
        console.warn(`Cannot delete exercise ${exerciseKey} - has exercise logs`);
        // In production: soft delete
      } else {
        await tx.workout_day_exercises.delete({
          where: { id: existingExercise.id },
        });
      }
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helper function to process sets within an exercise
// ────────────────────────────────────────────────────────────────────────────
async function processSetsForExercise(
  tx: any,
  existingExercise: ExistingExercise,
  incomingSets: z.infer<typeof SetSchema>[],
  intensityMode: IntensityMode
) {
  // Create map for existing sets by set_number
  const existingSetsMap = new Map<number, ExistingSet>();
  existingExercise.workout_set_instructions.forEach(set => {
    existingSetsMap.set(set.set_number, set);
  });

  // Process incoming sets
  for (const set of incomingSets) {
    const existingSet = existingSetsMap.get(set.setNumber);

    if (existingSet) {
      // Update existing set
      await tx.workout_set_instructions.update({
        where: { id: existingSet.id },
        data: {
          set_number: set.setNumber,
          reps: set.reps ? parseInt(set.reps, 10) || null : null,
          intensity: intensityMode,
          weight_prescribed: set.weight ? parseFloat(set.weight) || null : null,
          rest_time: set.rest || null,
          notes: set.notes,
        },
      });
    } else {
      // Create new set
      await tx.workout_set_instructions.create({
        data: {
          id: uuidv4(),
          exercise_id: existingExercise.id,
          set_number: set.setNumber,
          reps: set.reps ? parseInt(set.reps, 10) || null : null,
          intensity: intensityMode,
          weight_prescribed: set.weight ? parseFloat(set.weight) || null : null,
          rest_time: set.rest || null,
          notes: set.notes,
        },
      });
    }
  }

  // Handle removed sets (check for logs before deletion)
  const incomingSetNumbers = new Set(incomingSets.map(s => s.setNumber));
  
  for (const [setNumber, existingSet] of existingSetsMap) {
    if (!incomingSetNumbers.has(setNumber)) {
      // Check if this set has logs
      const hasLogs = await tx.exercise_logs.findFirst({
        where: { set_id: existingSet.id },
      });

      if (hasLogs) {
        console.warn(`Cannot delete set ${setNumber} - has exercise logs`);
        // In production: soft delete
      } else {
        console.log(`Deleting set ${setNumber} `, `which has existingSet.id`, existingSet.id);
        await tx.workout_set_instructions.delete({
          where: { id: existingSet.id },
        });
      }
    }
  }
}

export const updateWorkoutPlan = createSafeAction<UpdateWorkoutPlanInput, UpdateWorkoutPlanOutput>(
  InputSchema,
  handler,
); 