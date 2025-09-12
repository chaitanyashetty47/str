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
// Helper function to generate UUIDs in bulk
// TODO: Remove this when schema.prisma uses @default(dbgenerated("gen_random_uuid()"))
// ────────────────────────────────────────────────────────────────────────────
function generateUUIDs(count: number): string[] {
  return Array.from({ length: count }, () => uuidv4());
}

// ────────────────────────────────────────────────────────────────────────────
// Helper function to prepare bulk update data
// ────────────────────────────────────────────────────────────────────────────
function prepareBulkUpdateData(
  planId: string,
  weeks: z.infer<typeof WeekSchema>[],
  startDate: Date,
  trainerWeightUnit: WeightUnit,
  intensityMode: IntensityMode,
  existingDaysMap: Map<string, ExistingDay>
) {
  const newDaysToCreate: any[] = [];
  const newExercisesToCreate: any[] = [];
  const newSetsToCreate: any[] = [];
  const daysToUpdate: any[] = [];

  // Calculate total new records needed for UUID generation
  const newDaysCount = weeks.reduce((sum, week) => {
    return sum + week.days.reduce((daySum, day) => {
      const dayKey = `${week.weekNumber}-${day.dayNumber}`;
      return existingDaysMap.has(dayKey) ? daySum : daySum + 1;
    }, 0);
  }, 0);

  const newExercisesCount = weeks.reduce((sum, week) => {
    return sum + week.days.reduce((daySum, day) => {
      const dayKey = `${week.weekNumber}-${day.dayNumber}`;
      const existingDay = existingDaysMap.get(dayKey);
      if (!existingDay) {
        return daySum + day.exercises.length;
      }
      return daySum;
    }, 0);
  }, 0);

  const newSetsCount = weeks.reduce((sum, week) => {
    return sum + week.days.reduce((daySum, day) => {
      const dayKey = `${week.weekNumber}-${day.dayNumber}`;
      const existingDay = existingDaysMap.get(dayKey);
      if (!existingDay) {
        return daySum + day.exercises.reduce((exSum, ex) => exSum + ex.sets.length, 0);
      }
      return daySum;
    }, 0);
  }, 0);

  // TODO: Remove UUID generation when schema.prisma uses database-generated UUIDs
  const dayIds = generateUUIDs(newDaysCount);
  const exerciseIds = generateUUIDs(newExercisesCount);
  const setIds = generateUUIDs(newSetsCount);

  let dayIdIndex = 0;
  let exerciseIdIndex = 0;
  let setIdIndex = 0;

  // Process weeks and days
  weeks.forEach(week => {
    week.days.forEach(day => {
      const dayKey = `${week.weekNumber}-${day.dayNumber}`;
      const existingDay = existingDaysMap.get(dayKey);
      
      // Calculate day date
      const calculatedDate = addDays(startDate, (week.weekNumber - 1) * 7 + (day.dayNumber - 1));
      const dayDate = stripTimezone(calculatedDate);

      if (existingDay) {
        // Day exists - prepare for update
        daysToUpdate.push({
          id: existingDay.id,
          week_number: week.weekNumber,
          day_number: day.dayNumber,
          title: day.title,
          day_date: dayDate,
        });
      } else {
        // New day - prepare for creation
        const dayId = dayIds[dayIdIndex++];
        
        newDaysToCreate.push({
          id: dayId, // TODO: Remove when using database-generated UUIDs
          plan_id: planId,
          week_number: week.weekNumber,
          day_number: day.dayNumber,
          day_date: dayDate,
          title: day.title,
        });

        // Process exercises for new day
        day.exercises.forEach((exercise, exerciseIndex) => {
          const exerciseId = exerciseIds[exerciseIdIndex++];

          newExercisesToCreate.push({
            id: exerciseId, // TODO: Remove when using database-generated UUIDs
            workout_day_id: dayId,
            list_exercise_id: exercise.listExerciseId,
            order: exerciseIndex + 1,
            instructions: exercise.instructions || "",
            youtube_link: null,
            notes: "",
            frontend_uid: exercise.uid,
          });

          // Process sets for new exercise
          exercise.sets.forEach(set => {
            const setId = setIds[setIdIndex++];
            
            const weightValue = set.weight ? parseFloat(set.weight) : null;
            const weightInKg = weightValue ? convertToKg(weightValue, trainerWeightUnit) : null;

            newSetsToCreate.push({
              id: setId, // TODO: Remove when using database-generated UUIDs
              exercise_id: exerciseId,
              set_number: set.setNumber,
              reps: set.reps ? parseInt(set.reps, 10) || null : null,
              intensity: intensityMode,
              weight_prescribed: weightInKg,
              rest_time: set.rest || null,
              notes: set.notes,
            });
          });
        });
      }
    });
  });

  return {
    newDays: newDaysToCreate,
    newExercises: newExercisesToCreate,
    newSets: newSetsToCreate,
    daysToUpdate,
  };
}

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

    // OPTIMIZATION: Prepare bulk update data in memory
    console.log('⚡ Preparing workout plan update data...');
    
    try {
      // Optimized transaction with bulk operations (reduced DB calls)
      console.log('⚡ Starting optimized update transaction with 5-minute timeout...');
      await prisma.$transaction(async (tx) => {
      console.log('⚡ Update transaction started successfully');

      // 1. Get the current plan data to check if start_date changed
      console.log('🔍 Step 1: Getting current plan data...');
      const currentPlan = await tx.workout_plans.findUnique({
        where: { id },
        select: { start_date: true }
      });
      console.log('✅ Step 1: Current plan data retrieved');

      const startDateChanged = currentPlan && 
        currentPlan.start_date.getTime() !== startDate.getTime();

      // 2. Update plan meta (1 DB call)
      console.log('🔍 Step 2: Updating workout plan meta...');
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
      console.log('✅ Step 2: Updated workout plan meta');

      // 3. Get existing structure for comparison (1 DB call)
      console.log('🔍 Step 3: Getting existing structure for comparison...');
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
      console.log(`✅ Step 3: Retrieved ${existingDays.length} existing days`);

      // 4. Create lookup map for existing data
      console.log('🔍 Step 4: Creating lookup map for existing data...');
      const existingDaysMap = new Map<string, ExistingDay>();
      existingDays.forEach(day => {
        const dayKey = `${day.week_number}-${day.day_number}`;
        existingDaysMap.set(dayKey, day);
      });
      console.log(`✅ Step 4: Created lookup map with ${existingDaysMap.size} entries`);

      // 5. Prepare bulk update data
      console.log('🔍 Step 5: Preparing bulk update data...');
      const bulkData = prepareBulkUpdateData(
        id,
        weeks,
        startDate,
        trainerWeightUnit,
        meta.intensityMode,
        existingDaysMap
      );
      console.log('✅ Step 5: Bulk update data prepared');

      console.log(`⚡ Prepared ${bulkData.newDays.length} new days, ${bulkData.newExercises.length} new exercises, ${bulkData.newSets.length} new sets`);
      console.log(`⚡ Prepared ${bulkData.daysToUpdate.length} days to update`);

      // 6. Bulk create new days (1 DB call)
      console.log('🔍 Step 6: Creating new days...');
      if (bulkData.newDays.length > 0) {
        await tx.workout_days.createMany({
          data: bulkData.newDays
        });
        console.log(`✅ Step 6: Created ${bulkData.newDays.length} new workout days`);
      } else {
        console.log('✅ Step 6: No new days to create');
      }

      // 7. Bulk create new exercises (1 DB call)
      console.log('🔍 Step 7: Creating new exercises...');
      if (bulkData.newExercises.length > 0) {
        await tx.workout_day_exercises.createMany({
          data: bulkData.newExercises
        });
        console.log(`✅ Step 7: Created ${bulkData.newExercises.length} new workout exercises`);
      } else {
        console.log('✅ Step 7: No new exercises to create');
      }

      // 8. Bulk create new sets (1 DB call)
      console.log('🔍 Step 8: Creating new sets...');
      if (bulkData.newSets.length > 0) {
        await tx.workout_set_instructions.createMany({
          data: bulkData.newSets
        });
        console.log(`✅ Step 8: Created ${bulkData.newSets.length} new workout sets`);
      } else {
        console.log('✅ Step 8: No new sets to create');
      }

      // 9. Update existing days individually (optimized with change detection)
      console.log('🔍 Step 9: Updating existing days...');
      let daysUpdated = 0;
      let daysSkipped = 0;
      
      for (let i = 0; i < bulkData.daysToUpdate.length; i++) {
        const dayUpdate = bulkData.daysToUpdate[i];
        
        // Find the existing day to compare
        const lookupKey = `${dayUpdate.week_number}-${dayUpdate.day_number}`;
        const existingDay = existingDaysMap.get(lookupKey);
        
        console.log(`🔍 DEBUG - Day ${i + 1}/${bulkData.daysToUpdate.length}:`);
        console.log(`  Lookup key: "${lookupKey}"`);
        console.log(`  Existing day found: ${!!existingDay}`);
        
        if (existingDay) {
          console.log(`  Existing title: "${existingDay.title}"`);
          console.log(`  Incoming title: "${dayUpdate.title}"`);
          console.log(`  Existing date: ${existingDay.day_date}`);
          console.log(`  Incoming date: ${dayUpdate.day_date}`);
          console.log(`  Title match: ${existingDay.title === dayUpdate.title}`);
          console.log(`  Date match: ${existingDay.day_date.getTime() === dayUpdate.day_date.getTime()}`);
          
          // Check if day needs updating
          const dayNeedsUpdate = 
            existingDay.title !== dayUpdate.title ||
            existingDay.day_date.getTime() !== dayUpdate.day_date.getTime();
          
          console.log(`  Day needs update: ${dayNeedsUpdate}`);
          
          if (dayNeedsUpdate) {
            console.log(`🔍 Updating day ${i + 1}/${bulkData.daysToUpdate.length} (ID: ${dayUpdate.id})`);
            await tx.workout_days.update({
              where: { id: dayUpdate.id },
              data: {
                title: dayUpdate.title,
                day_date: dayUpdate.day_date,
              },
            });
            daysUpdated++;
          } else {
            console.log(`⏭️ Skipped day ${i + 1}/${bulkData.daysToUpdate.length} (ID: ${dayUpdate.id}) - no changes detected`);
            daysSkipped++;
          }
        } else {
          console.log(`❌ ERROR: No existing day found for key "${lookupKey}"`);
          console.log(`  Available keys in map:`, Array.from(existingDaysMap.keys()));
        }
      }
      const dayOptimizationPercentage = (daysUpdated + daysSkipped) > 0 ? Math.round(daysSkipped / (daysUpdated + daysSkipped) * 100) : 0;
      console.log(`📊 Day Processing Summary: ${daysUpdated} updated, ${daysSkipped} skipped (${dayOptimizationPercentage}% optimization)`);

      // 10. Process exercises for existing days (optimized with existing helper functions)
      console.log('🔍 Step 10: Processing exercises for existing days...');
      let processedDays = 0;
      for (const week of weeks) {
        for (const day of week.days) {
          const dayKey = `${week.weekNumber}-${day.dayNumber}`;
          const existingDay = existingDaysMap.get(dayKey);

          if (existingDay) {
            processedDays++;
            console.log(`🔍 Processing exercises for day ${processedDays} (${dayKey}) - ${day.exercises.length} exercises`);
            // Use existing optimized helper function for exercise processing
            await processExercisesForDay(tx, existingDay, day.exercises, trainerWeightUnit, meta.intensityMode);
            console.log(`✅ Completed processing exercises for day ${dayKey}`);
          }
        }
      }
      console.log(`✅ Step 10: Processed exercises for ${processedDays} days`);
      console.log(`📊 TRANSACTION PROGRESS: All ${processedDays} days processed successfully`);

      // 11. Handle removed days (soft delete by checking if any logs exist)
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

        console.log('⚡ Optimized update transaction completed successfully');
        console.log('🎉 ALL TRANSACTION STEPS COMPLETED - TRANSACTION SUCCESSFUL');
      }, {
        timeout: 300000, // 5 minutes timeout for complex workout plan updates
      });
      
      console.log('✅ Workout plan update completed successfully');
      return { data: { ok: true } };
    } catch (e: any) {
      console.error('❌ Error updating workout plan:', e);
      console.error('❌ Error details:', {
        message: e.message,
        code: e.code,
        meta: e.meta,
        stack: e.stack
      });
      return { error: e.message };
    }
  } catch (e: any) {
    console.error('❌ Error in workout plan update handler:', e);
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
  trainerWeightUnit: WeightUnit,
  intensityMode: IntensityMode = IntensityMode.ABSOLUTE
) {
  console.log(`🔍 Processing ${incomingExercises.length} exercises for day ${existingDay.week_number}-${existingDay.day_number}`);
  
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
  
  console.log(`🔍 Found ${existingExercisesByUid.size} exercises by UID, ${existingExercisesByListId.size} by list ID`);

  // Process incoming exercises
  for (let i = 0; i < incomingExercises.length; i++) {
    const exercise = incomingExercises[i];
    console.log(`🔍 Processing exercise ${i + 1}/${incomingExercises.length}: ${exercise.name} (UID: ${exercise.uid})`);
    
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
      // Check if exercise needs updating
      const exerciseNeedsUpdate = 
        existingExercise.list_exercise_id !== exercise.listExerciseId ||
        existingExercise.order !== (i + 1) ||
        existingExercise.instructions !== (exercise.instructions || "") ||
        existingExercise.notes !== "" ||
        existingExercise.frontend_uid !== exercise.uid;

      if (exerciseNeedsUpdate) {
        console.log(`🔍 Updating existing exercise ${existingExercise.id} with ${exercise.sets.length} sets`);
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
        console.log(`✅ Updated exercise ${existingExercise.id}`);
      } else {
        console.log(`⏭️ Skipped exercise ${existingExercise.id} (${exercise.name}) - no changes detected`);
      }

      // Process sets for this exercise
      console.log(`🔍 Processing ${exercise.sets.length} sets for exercise ${existingExercise.id}`);
      await processSetsForExercise(tx, existingExercise, exercise.sets, trainerWeightUnit, intensityMode);
      console.log(`✅ Completed processing sets for exercise ${existingExercise.id}`);
    } else {
      console.log(`🔍 Creating new exercise with ${exercise.sets.length} sets`);
      // Create new exercise
      await tx.workout_day_exercises.create({
        data: {
          id: uuidv4(), // TODO: Remove when using database-generated UUIDs
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
                          id: uuidv4(), // TODO: Remove when using database-generated UUIDs // TODO: Remove when using database-generated UUIDs
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
      console.log(`✅ Created new exercise with ${exercise.sets.length} sets`);
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
// Helper function to update set only if changed
// ────────────────────────────────────────────────────────────────────────────
async function updateSetIfChanged(
  tx: any,
  existingSet: ExistingSet,
  incomingSet: z.infer<typeof SetSchema>,
  trainerWeightUnit: WeightUnit,
  intensityMode: IntensityMode
) {
  const weightValue = incomingSet.weight ? parseFloat(incomingSet.weight) : null;
  const weightInKg = weightValue ? convertToKg(weightValue, trainerWeightUnit) : null;
  
  // Convert incoming data to match database format
  const incomingReps = incomingSet.reps ? parseInt(incomingSet.reps, 10) || null : null;
  const incomingRest = incomingSet.rest || null;
  const incomingNotes = incomingSet.notes || null;
  
  // Build update data only for changed fields
  const updateData: any = {};
  const changedFields: string[] = [];
  
  // Compare set_number
  if (existingSet.set_number !== incomingSet.setNumber) {
    updateData.set_number = incomingSet.setNumber;
    changedFields.push(`set_number: ${existingSet.set_number} → ${incomingSet.setNumber}`);
  }
  
  // Compare reps (handle null/empty string conversion)
  if (existingSet.reps !== incomingReps) {
    updateData.reps = incomingReps;
    changedFields.push(`reps: ${existingSet.reps} → ${incomingReps}`);
  }
  
  // Compare weight (handle precision and null conversion)
  if (existingSet.weight_prescribed !== weightInKg) {
    updateData.weight_prescribed = weightInKg;
    changedFields.push(`weight: ${existingSet.weight_prescribed} → ${weightInKg}`);
  }
  
  // Compare rest_time
  if (existingSet.rest_time !== incomingRest) {
    updateData.rest_time = incomingRest;
    changedFields.push(`rest: ${existingSet.rest_time} → ${incomingRest}`);
  }
  
  // Compare notes (handle null/empty string conversion)
  // Normalize both values: convert null/empty to null for comparison
  const normalizedExistingNotes = existingSet.notes || null;
  const normalizedIncomingNotes = incomingNotes || null;
  
  if (normalizedExistingNotes !== normalizedIncomingNotes) {
    updateData.notes = incomingNotes;
    changedFields.push(`notes: "${existingSet.notes}" → "${incomingNotes}"`);
  }
  
  // Compare intensity (this might always be the same, but let's check)
  if (existingSet.intensity !== intensityMode) {
    updateData.intensity = intensityMode;
    changedFields.push(`intensity: ${existingSet.intensity} → ${intensityMode}`);
  }
  
  // Only update if there are changes
  if (Object.keys(updateData).length > 0) {
    console.log(`🔍 Updating set ${existingSet.id} (Set ${incomingSet.setNumber}) - ${Object.keys(updateData).length} fields changed:`);
    console.log(`   Changes: ${changedFields.join(', ')}`);
    
    await tx.workout_set_instructions.update({
      where: { id: existingSet.id },
      data: updateData,
    });
    console.log(`✅ Updated set ${existingSet.id}`);
    return true; // Indicates update was performed
  } else {
    console.log(`⏭️ Skipped set ${existingSet.id} (Set ${incomingSet.setNumber}) - no changes detected`);
    return false; // Indicates no update was needed
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helper function to process sets within an exercise
// ────────────────────────────────────────────────────────────────────────────
async function processSetsForExercise(
  tx: any,
  existingExercise: ExistingExercise,
  incomingSets: z.infer<typeof SetSchema>[],
  trainerWeightUnit: WeightUnit,
  intensityMode: IntensityMode = IntensityMode.ABSOLUTE
) {
  console.log(`🔍 Processing ${incomingSets.length} sets for exercise ${existingExercise.id}`);
  
  // Statistics tracking
  let setsUpdated = 0;
  let setsSkipped = 0;
  
  // Create map for existing sets by set_number
  const existingSetsMap = new Map<number, ExistingSet>();
  existingExercise.workout_set_instructions.forEach(set => {
    existingSetsMap.set(set.set_number, set);
  });
  
  console.log(`🔍 Found ${existingSetsMap.size} existing sets`);

  // Process incoming sets
  for (let i = 0; i < incomingSets.length; i++) {
    const set = incomingSets[i];
    console.log(`🔍 Processing set ${i + 1}/${incomingSets.length}: Set ${set.setNumber} (${set.reps} reps, ${set.weight} weight)`);
    const existingSet = existingSetsMap.get(set.setNumber);

    if (existingSet) {
      // Use change detection to only update if needed
      const wasUpdated = await updateSetIfChanged(tx, existingSet, set, trainerWeightUnit, intensityMode);
      if (wasUpdated) {
        setsUpdated++;
      } else {
        setsSkipped++;
      }
    } else {
      console.log(`🔍 Creating new set ${set.setNumber} for exercise ${existingExercise.id}`);
      // Create new set
      // For reps-based exercises, skip weight conversion
      // For weight-based exercises, convert weight to KG before storing
      const weightValue = set.weight ? parseFloat(set.weight) : null;
      const weightInKg = weightValue ? convertToKg(weightValue, trainerWeightUnit) : null;
      
      await tx.workout_set_instructions.create({
        data: {
          id: uuidv4(), // TODO: Remove when using database-generated UUIDs
          exercise_id: existingExercise.id,
          set_number: set.setNumber,
          reps: set.reps ? parseInt(set.reps, 10) || null : null,
          intensity: intensityMode,
          weight_prescribed: weightInKg, // Will be null for reps-based exercises
          rest_time: set.rest || null,
          notes: set.notes,
        },
      });
      console.log(`✅ Created new set ${set.setNumber}`);
      setsUpdated++; // Count new creations as updates
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
  
  // Statistics summary
  const totalSets = setsUpdated + setsSkipped;
  const optimizationPercentage = totalSets > 0 ? Math.round(setsSkipped / totalSets * 100) : 0;
  console.log(`📊 Set Processing Summary: ${setsUpdated} updated, ${setsSkipped} skipped (${optimizationPercentage}% optimization)`);
}

export const updateWorkoutPlan = createSafeAction<UpdateWorkoutPlanInput, UpdateWorkoutPlanOutput>(
  InputSchema,
  handler,
); 