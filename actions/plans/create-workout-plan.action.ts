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
// Handler
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

    // Wrap everything in a transaction so either all inserts succeed or none.
    // Increase timeout for complex workout plans with many days/exercises
    const createdPlan = await prisma.$transaction(async (tx) => {
      // 1. Insert plan skeleton
      const plan = await tx.workout_plans.create({
        data: {
          id: uuidv4(),
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

      // 2. Insert weeks → days → exercises → sets
      for (const week of weeks) {
        for (const day of week.days) {
          const dayId = uuidv4();
          // Calculate day date directly from user's start date
          // Week 1 Day 1 = startDate + 0 days
          // Week 1 Day 2 = startDate + 1 day
          // Week 2 Day 1 = startDate + 7 days
          // Strip timezone info to ensure pure date storage
          const calculatedDate = addDays(startDate, (week.weekNumber - 1) * 7 + (day.dayNumber - 1));
          const dayDate = stripTimezone(calculatedDate);

          await tx.workout_days.create({
            data: {
              id: dayId,
              plan_id: plan.id,
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
                    create: ex.sets.map((s) => {
                      // For reps-based exercises, skip weight conversion
                      // For weight-based exercises, convert weight to KG before storing
                      const weightValue = s.weight ? parseFloat(s.weight) : null;
                      const weightInKg = weightValue ? convertToKg(weightValue, trainerWeightUnit) : null;
                      
                      return {
                        id: uuidv4(),
                        set_number: s.setNumber,
                        reps: s.reps ? parseInt(s.reps, 10) || null : null,
                        intensity: meta.intensityMode,
                        weight_prescribed: weightInKg, // Will be null for reps-based exercises
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

      return plan;
    }, {
      timeout: 15000, // 15 seconds timeout for complex workout plans
    });

    return { data: { id: createdPlan.id } };
  } catch (e: any) {
    return { error: e.message };
  }
}

export const createWorkoutPlan = createSafeAction<CreateWorkoutPlanInput, CreateWorkoutPlanOutput>(
  InputSchema,
  handler,
); 