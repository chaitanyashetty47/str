'use server';
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import {
  IntensityMode,
  WorkoutPlanStatus,
  WorkoutCategory,
  BodyPart,
  WeightUnit,
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { addDays, format } from "date-fns";
import { convertToKg } from "@/utils/weight";
import { requireTrainerAccess } from "@/utils/user";
import { stripTimezone } from "@/utils/date-utils";

// ────────────────────────────────────────────────────────────────────────────
// Helper function to check for conflicting published plans
// ────────────────────────────────────────────────────────────────────────────
async function checkPlanConflicts(
  clientId: string,
  trainerId: string,
  startDate: Date,
  endDate: Date,
  excludePlanId?: string
): Promise<string | null> {
  const conflictingPlan = await prisma.workout_plans.findFirst({
    where: {
      client_id: clientId,
      trainer_id: trainerId,
      status: WorkoutPlanStatus.PUBLISHED,
      id: excludePlanId ? { not: excludePlanId } : undefined,
      OR: [
        {
          // New plan starts during existing plan
          start_date: { lte: startDate },
          end_date: { gte: startDate },
        },
        {
          // New plan ends during existing plan
          start_date: { lte: endDate },
          end_date: { gte: endDate },
        },
        {
          // New plan completely contains existing plan
          start_date: { gte: startDate },
          end_date: { lte: endDate },
        },
      ],
    },
    select: {
      title: true,
      start_date: true,
      end_date: true,
    },
  });

  if (conflictingPlan) {
    const conflictStartDate = format(conflictingPlan.start_date, "dd/MM/yyyy");
    const conflictEndDate = format(conflictingPlan.end_date, "dd/MM/yyyy");
    const suggestedStartDate = format(addDays(conflictingPlan.end_date, 1), "dd/MM/yyyy");
    
    return `Choose start date after ${conflictEndDate} as previous plan '${conflictingPlan.title}' (${conflictStartDate} - ${conflictEndDate}) is currently published. Suggested start date: ${suggestedStartDate}`;
  }

  return null;
}

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
  dayNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)]),
  title: z.string(),
  exercises: z.array(ExerciseSchema),
  estimatedTimeMinutes: z.number().int().nonnegative(),
});

const WeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  days: z.array(DaySchema).min(3).max(7), // Minimum 3 days, maximum 7 days
});

const MetaSchema = z.object({
  title: z.string(),
  description: z.string(),
  startDate: z.coerce.date(),
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
  is_deleted?: boolean;
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
  frontend_uid: string | null;
  is_deleted?: boolean;
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
  is_deleted?: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Handler with Diff-Based Updates
// ────────────────────────────────────────────────────────────────────────────
async function handler({ id, meta, weeks }: UpdateWorkoutPlanInput) {
  try {
    // Check if authenticated user is a fitness trainer
    const { userId: authenticatedUserId } = await requireTrainerAccess();

    if (!authenticatedUserId) {
      throw new Error("No user found");    
    }
    // Get existing plan to check ownership
    const existingPlan = await prisma.workout_plans.findUnique({
      where: { id },
      select: { trainer_id: true }
    });

    if (!existingPlan) {
      throw new Error("Plan not found");
    }

    // Ensure the authenticated trainer can only update their own plans
    if (authenticatedUserId !== existingPlan.trainer_id) {
      throw new Error("You can only update your own workout plans");
    }

    const trainer = await prisma.users_profile.findUnique({
      where: { id: existingPlan.trainer_id },
      select: { weight_unit: true }
    });

    const trainerWeightUnit = trainer?.weight_unit || WeightUnit.KG;

    // Debug: Log the exact dates we're receiving
    console.log('🔍 DEBUG - Raw meta.startDate:', meta.startDate);
    console.log('🔍 DEBUG - meta.startDate.toISOString():', meta.startDate.toISOString());
    console.log('🔍 DEBUG - meta.startDate.toString():', meta.startDate.toString());
    console.log('🔍 DEBUG - meta.startDate.getTime():', meta.startDate.getTime());
    
    // Use the exact start date provided by the user, but strip timezone info
    // Convert to plain date (DD-MM-YYYY) to avoid timezone issues
    const startDate = stripTimezone(meta.startDate);
    console.log('🔍 DEBUG - After stripTimezone:', startDate);
    console.log('🔍 DEBUG - After stripTimezone.toISOString():', startDate.toISOString());
    
    const endDate = addDays(startDate, meta.durationWeeks * 7 - 1);

    // Check for conflicts only if the plan is being published
    if (meta.status === WorkoutPlanStatus.PUBLISHED) {
      const conflictError = await checkPlanConflicts(
        meta.clientId,
        existingPlan.trainer_id,
        startDate,
        endDate,
        id // Exclude current plan from conflict check
      );
      
      if (conflictError) {
        return { error: conflictError };
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Get the current plan data to check if start_date changed
      const currentPlan = await tx.workout_plans.findUnique({
        where: { id },
        select: { start_date: true }
      });

      const startDateChanged = currentPlan && 
        currentPlan.start_date.getTime() !== startDate.getTime();

      // 2. Update plan meta
      await tx.workout_plans.update({
        where: { id },
        data: {
          title: meta.title,
          description: meta.description,
          start_date: startDate,
          end_date: endDate,
          duration_in_weeks: meta.durationWeeks,
          category: meta.category,
          intensity_mode: meta.intensityMode,
          status: meta.status,
        },
      });

      // 3. Get existing structure for comparison
      const existingDays = await tx.workout_days.findMany({
        where: { 
          plan_id: id,
          is_deleted: false // Only get active days
        },
        include: {
          workout_day_exercises: {
            where: { is_deleted: false }, // Only get active exercises
            include: {
              workout_set_instructions: {
                where: { is_deleted: false }, // Only get active sets
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [{ week_number: 'asc' }, { day_number: 'asc' }],
      }) as ExistingDay[];

      // 4. ONLY update day_date values if start_date actually changed
      if (startDateChanged) {
        console.log(`Start date changed from ${currentPlan?.start_date} to ${startDate}, updating all day dates...`);
        
        for (const existingDay of existingDays) {
          const calculatedDate = addDays(startDate, (existingDay.week_number - 1) * 7 + (existingDay.day_number - 1));
          // Strip timezone info to ensure pure date storage
          const newDayDate = stripTimezone(calculatedDate);
          
          await tx.workout_days.update({
            where: { id: existingDay.id },
            data: {
              day_date: newDayDate,
            },
          });
        }
        
        console.log(`Updated ${existingDays.length} workout days with new dates`);
      } else {
        console.log('Start date unchanged, skipping day date updates');
      }

      // 5. Create lookup maps for existing data
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

      // 6. Process each week and day from the incoming data
      for (const week of weeks) {
        for (const day of week.days) {
          const dayKey = `${week.weekNumber}-${day.dayNumber}`;
          const existingDay = existingDaysMap.get(dayKey);
          // Calculate day date directly from user's start date
          // Strip timezone info to ensure pure date storage
          const calculatedDate = addDays(startDate, (week.weekNumber - 1) * 7 + (day.dayNumber - 1));
          const dayDate = stripTimezone(calculatedDate);

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
            await processExercisesForDay(tx, existingDay, day.exercises, meta.intensityMode, trainerWeightUnit);
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
                    frontend_uid: ex.uid, // Store UID for future matching
                    workout_set_instructions: {
                      create: ex.sets.map((s) => {
                        // Convert weight to KG before storing
                        const weightValue = s.weight ? parseFloat(s.weight) : null;
                        const weightInKg = weightValue ? convertToKg(weightValue, trainerWeightUnit) : null;
                        
                        return {
                          id: uuidv4(),
                          set_number: s.setNumber,
                          reps: s.reps ? parseInt(s.reps, 10) || null : null,
                          intensity: meta.intensityMode,
                          weight_prescribed: weightInKg,
                          rest_time: s.rest || null,
                          notes: s.notes,
                        };
                      }),
                    },
                  })),
                },
              },
            });
          }
        }
      }

      // 7. Handle removed days (soft delete by checking if any logs exist)
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
            // Soft delete the day - preserves data integrity
            await tx.workout_days.update({
              where: { id: existingDay.id },
              data: { 
                is_deleted: true, 
                deleted_at: new Date() 
              }
            });
            console.log(`Soft deleted day ${dayKey} - has exercise logs`);
          } else {
            // Safe to hard delete - no logs
            await tx.workout_days.delete({
              where: { id: existingDay.id },
            });
            console.log(`Hard deleted day ${dayKey} - no exercise logs`);
          }
        }
      }
    }, {
      timeout: 15000, // 15 seconds timeout for complex workout plan updates
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
  intensityMode: IntensityMode,
  trainerWeightUnit: WeightUnit
) {
  // Create maps for easier lookup - now using UID-based matching
  const existingExercisesByUid = new Map<string, ExistingExercise>();
  const existingExercisesByListId = new Map<string, ExistingExercise>();
  
  existingDay.workout_day_exercises.forEach(ex => {
    // Primary: Map by frontend UID (for exercises created/edited via new system)
    if (ex.frontend_uid) {
      existingExercisesByUid.set(ex.frontend_uid, ex);
    }
    // Fallback: Map by list_exercise_id (for legacy exercises without UID)
    existingExercisesByListId.set(ex.list_exercise_id, ex);
  });

  // Process incoming exercises
  for (let i = 0; i < incomingExercises.length; i++) {
    const exercise = incomingExercises[i];
    
    // Try to match by UID first, then fallback to listExerciseId
    let existingExercise = existingExercisesByUid.get(exercise.uid);
    if (!existingExercise) {
      // Fallback matching for legacy data or new exercises
      existingExercise = existingExercisesByListId.get(exercise.listExerciseId);
      // Remove from fallback map to prevent duplicate matching
      if (existingExercise) {
        existingExercisesByListId.delete(exercise.listExerciseId);
      }
    }

    if (existingExercise) {
      // Update existing exercise - preserve ID, update all other fields
      await tx.workout_day_exercises.update({
        where: { id: existingExercise.id },
        data: {
          list_exercise_id: exercise.listExerciseId,
          order: i + 1, // Update order based on current position
          instructions: exercise.instructions || "",
          notes: "",
          frontend_uid: exercise.uid, // Ensure UID is stored for future updates
        },
      });

      // Process sets for this exercise
      await processSetsForExercise(tx, existingExercise, exercise.sets, intensityMode, trainerWeightUnit);
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
          frontend_uid: exercise.uid, // Store UID for future matching
          workout_set_instructions: {
            create: exercise.sets.map((s) => {
              // For reps-based exercises, skip weight conversion
              // For weight-based exercises, convert weight to KG before storing
              const weightValue = s.weight ? parseFloat(s.weight) : null;
              const weightInKg = weightValue ? convertToKg(weightValue, trainerWeightUnit) : null;
              
              return {
                id: uuidv4(),
                set_number: s.setNumber,
                reps: s.reps ? parseInt(s.reps, 10) || null : null,
                intensity: intensityMode,
                weight_prescribed: weightInKg, // Will be null for reps-based exercises
                rest_time: s.rest || null,
                notes: s.notes,
              };
            }),
          },
        },
      });
    }
  }

  // Handle removed exercises - use soft delete when logs exist
  const incomingExerciseUids = new Set(incomingExercises.map(ex => ex.uid));
  
  for (const existingExercise of existingDay.workout_day_exercises) {
    // Check if this exercise is still present in incoming data
    const isStillPresent = existingExercise.frontend_uid 
      ? incomingExerciseUids.has(existingExercise.frontend_uid)
      : incomingExercises.some(ex => ex.listExerciseId === existingExercise.list_exercise_id);

    if (!isStillPresent) {
      // Check if any sets in this exercise have logs
      const hasLogs = await tx.exercise_logs.findFirst({
        where: {
          set_id: {
            in: existingExercise.workout_set_instructions.map(set => set.id),
          },
        },
      });

      if (hasLogs) {
        // Soft delete - preserves data integrity
        await tx.workout_day_exercises.update({
          where: { id: existingExercise.id },
          data: { 
            is_deleted: true, 
            deleted_at: new Date() 
          }
        });
        console.log(`Soft deleted exercise ${existingExercise.id} - has exercise logs`);
      } else {
        // Hard delete - completely removes
        await tx.workout_day_exercises.delete({
          where: { id: existingExercise.id },
        });
        console.log(`Hard deleted exercise ${existingExercise.id} - no exercise logs`);
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
  intensityMode: IntensityMode,
  trainerWeightUnit: WeightUnit
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
      // For reps-based exercises, skip weight conversion
      // For weight-based exercises, convert weight to KG before storing
      const weightValue = set.weight ? parseFloat(set.weight) : null;
      const weightInKg = weightValue ? convertToKg(weightValue, trainerWeightUnit) : null;
      
      await tx.workout_set_instructions.update({
        where: { id: existingSet.id },
        data: {
          set_number: set.setNumber,
          reps: set.reps ? parseInt(set.reps, 10) || null : null,
          intensity: intensityMode,
          weight_prescribed: weightInKg, // Will be null for reps-based exercises
          rest_time: set.rest || null,
          notes: set.notes,
        },
      });
    } else {
      // Create new set
      // For reps-based exercises, skip weight conversion
      // For weight-based exercises, convert weight to KG before storing
      const weightValue = set.weight ? parseFloat(set.weight) : null;
      const weightInKg = weightValue ? convertToKg(weightValue, trainerWeightUnit) : null;
      
      await tx.workout_set_instructions.create({
        data: {
          id: uuidv4(),
          exercise_id: existingExercise.id,
          set_number: set.setNumber,
          reps: set.reps ? parseInt(set.reps, 10) || null : null,
          intensity: intensityMode,
          weight_prescribed: weightInKg, // Will be null for reps-based exercises
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
        // Soft delete - preserves data integrity
        await tx.workout_set_instructions.update({
          where: { id: existingSet.id },
          data: { 
            is_deleted: true, 
            deleted_at: new Date() 
          }
        });
        console.log(`Soft deleted set ${setNumber} (ID: ${existingSet.id}) - has exercise logs`);
      } else {
        // Hard delete - completely removes
        await tx.workout_set_instructions.delete({
          where: { id: existingSet.id },
        });
        console.log(`Hard deleted set ${setNumber} (ID: ${existingSet.id}) - no exercise logs`);
      }
    }
  }
}

export const updateWorkoutPlan = createSafeAction<UpdateWorkoutPlanInput, UpdateWorkoutPlanOutput>(
  InputSchema,
  handler,
); 