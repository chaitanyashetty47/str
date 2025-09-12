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
// Zod schemas mirroring editor-state types for runtime validation
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
  trainerId: z.string().uuid(),
  meta: MetaSchema,
  weeks: z.array(WeekSchema).min(1),
});

export type CreateWorkoutPlanInput = z.infer<typeof InputSchema>;
export type CreateWorkoutPlanOutput = { id: string };

// ────────────────────────────────────────────────────────────────────────────
// Helper function to generate UUIDs in bulk
// TODO: Remove this when schema.prisma uses @default(dbgenerated("gen_random_uuid()"))
// ────────────────────────────────────────────────────────────────────────────
function generateUUIDs(count: number): string[] {
  return Array.from({ length: count }, () => uuidv4());
}

// ────────────────────────────────────────────────────────────────────────────
// Helper function to prepare all workout plan data in memory (bulk optimization)
// ────────────────────────────────────────────────────────────────────────────
function prepareWorkoutPlanData(
  planId: string,
  weeks: z.infer<typeof WeekSchema>[],
  startDate: Date,
  trainerWeightUnit: WeightUnit,
  intensityMode: IntensityMode
) {
  // Calculate total records needed for UUID generation
  const totalDays = weeks.reduce((sum, week) => sum + week.days.length, 0);
  const totalExercises = weeks.reduce((sum, week) => 
    sum + week.days.reduce((daySum, day) => daySum + day.exercises.length, 0), 0);
  const totalSets = weeks.reduce((sum, week) => 
    sum + week.days.reduce((daySum, day) => 
      daySum + day.exercises.reduce((exSum, ex) => exSum + ex.sets.length, 0), 0), 0);

  // TODO: Remove UUID generation when schema.prisma uses database-generated UUIDs
  const dayIds = generateUUIDs(totalDays);
  const exerciseIds = generateUUIDs(totalExercises);
  const setIds = generateUUIDs(totalSets);

  // Prepare data arrays for bulk operations
  const allDaysData: any[] = [];
  const allExercisesData: any[] = [];
  const allSetsData: any[] = [];

  let dayIdIndex = 0;
  let exerciseIdIndex = 0;
  let setIdIndex = 0;

  // Process all weeks/days/exercises/sets in memory
  weeks.forEach(week => {
    week.days.forEach(day => {
      const dayId = dayIds[dayIdIndex++];
      
      // Calculate day date directly from user's start date
      // Week 1 Day 1 = startDate + 0 days
      // Week 1 Day 2 = startDate + 1 day
      // Week 2 Day 1 = startDate + 7 days
      const calculatedDate = addDays(startDate, (week.weekNumber - 1) * 7 + (day.dayNumber - 1));
      const dayDate = stripTimezone(calculatedDate);

      // Prepare day data
      allDaysData.push({
        id: dayId, // TODO: Remove when using database-generated UUIDs
        plan_id: planId,
        week_number: week.weekNumber,
        day_number: day.dayNumber,
        day_date: dayDate,
        title: day.title,
      });

      // Process exercises for this day
      day.exercises.forEach((exercise, exerciseIndex) => {
        const exerciseId = exerciseIds[exerciseIdIndex++];

        // Prepare exercise data
        allExercisesData.push({
          id: exerciseId, // TODO: Remove when using database-generated UUIDs
          workout_day_id: dayId,
          list_exercise_id: exercise.listExerciseId,
          order: exerciseIndex + 1,
          instructions: exercise.instructions || "",
          youtube_link: null,
          notes: "",
          frontend_uid: exercise.uid, // Store frontend UID for future updates
        });

        // Process sets for this exercise
        exercise.sets.forEach(set => {
          const setId = setIds[setIdIndex++];
          
          // For reps-based exercises, skip weight conversion
          // For weight-based exercises, convert weight to KG before storing
          const weightValue = set.weight ? parseFloat(set.weight) : null;
          const weightInKg = weightValue ? convertToKg(weightValue, trainerWeightUnit) : null;

          // Prepare set data
          allSetsData.push({
            id: setId, // TODO: Remove when using database-generated UUIDs
            exercise_id: exerciseId,
            set_number: set.setNumber,
            reps: set.reps ? parseInt(set.reps, 10) || null : null,
            intensity: intensityMode,
            weight_prescribed: weightInKg, // Will be null for reps-based exercises
            rest_time: set.rest || null,
            notes: set.notes,
          });
        });
      });
    });
  });

  return {
    days: allDaysData,
    exercises: allExercisesData,
    sets: allSetsData,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Handler (Optimized with bulk operations)
// ────────────────────────────────────────────────────────────────────────────
async function handler({ trainerId, meta, weeks }: CreateWorkoutPlanInput) {
  try {
    // Check if authenticated user is a fitness trainer
    const { userId: authenticatedUserId } = await requireTrainerAccess();
    if (!authenticatedUserId) {
      throw new Error("No user found");    
    }
    // Ensure the authenticated trainer can only create plans for themselves
    if (authenticatedUserId !== trainerId) {
      throw new Error("You can only create workout plans for yourself");
    }

    // Get trainer's weight unit preference
    const trainer = await prisma.users_profile.findUnique({
      where: { id: trainerId },
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
    
    const endDate = addDays(startDate, meta.durationWeeks * 7 - 1); // End date is start date + (weeks * 7 - 1) days

    // Check for conflicts only if the plan is being published
    if (meta.status === WorkoutPlanStatus.PUBLISHED) {
      const conflictError = await checkPlanConflicts(
        meta.clientId,
        trainerId,
        startDate,
        endDate
      );
      
      if (conflictError) {
        return { error: conflictError };
      }
    }

    // TODO: Remove manual UUID generation when schema.prisma uses database-generated UUIDs
    const planId = uuidv4();

    // OPTIMIZATION: Prepare all data in memory before transaction (bulk operations)
    console.log('⚡ Preparing workout plan data in memory...');
    const workoutData = prepareWorkoutPlanData(
      planId,
      weeks,
      startDate,
      trainerWeightUnit,
      meta.intensityMode
    );
    console.log(`⚡ Prepared ${workoutData.days.length} days, ${workoutData.exercises.length} exercises, ${workoutData.sets.length} sets`);

    try {
      // Optimized transaction with bulk operations (4 DB calls instead of N×M×P×Q calls)
      console.log('⚡ Starting bulk transaction with 5-minute timeout...');
      const createdPlan = await prisma.$transaction(async (tx) => {
      console.log('⚡ Transaction started successfully');

      // 1. Create plan skeleton (1 DB call)
      const plan = await tx.workout_plans.create({
        data: {
          id: planId, // TODO: Remove when using database-generated UUIDs
          title: meta.title,
          description: meta.description,
          trainer_id: trainerId,
          client_id: meta.clientId,
          start_date: startDate,
          end_date: endDate,
          duration_in_weeks: meta.durationWeeks,
          category: meta.category,
          intensity_mode: meta.intensityMode,
          status: meta.status,
        },
      });
      console.log('✅ Created workout plan');

      // 2. Bulk insert workout days (1 DB call)
      await tx.workout_days.createMany({
        data: workoutData.days
      });
      console.log(`✅ Created ${workoutData.days.length} workout days`);

      // 3. Bulk insert workout exercises (1 DB call)
      await tx.workout_day_exercises.createMany({
        data: workoutData.exercises
      });
      console.log(`✅ Created ${workoutData.exercises.length} workout exercises`);

      // 4. Bulk insert workout sets (1 DB call)
      await tx.workout_set_instructions.createMany({
        data: workoutData.sets
      });
      console.log(`✅ Created ${workoutData.sets.length} workout sets`);

        console.log('⚡ Bulk transaction completed successfully');
        return plan;
      }, {
        timeout: 300000, // 5 minutes timeout for bulk operations
      });

      console.log('✅ Workout plan creation completed successfully');
      return { data: { id: createdPlan.id } };
    } catch (e: any) {
      console.error('❌ Error creating workout plan:', e);
      console.error('❌ Error details:', {
        message: e.message,
        code: e.code,
        meta: e.meta,
        stack: e.stack
      });
      return { error: e.message };
    }
  } catch (e: any) {
    console.error('❌ Error in workout plan creation handler:', e);
    return { error: e.message };
  }
}

export const createWorkoutPlan = createSafeAction<CreateWorkoutPlanInput, CreateWorkoutPlanOutput>(
  InputSchema,
  handler,
); 