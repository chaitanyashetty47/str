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
import { addDays, startOfWeek } from "date-fns";
import { convertToKg } from "@/utils/weight";

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
    // Get trainer's weight unit preference
    const trainer = await prisma.users_profile.findUnique({
      where: { id: trainerId },
      select: { weight_unit: true }
    });

    const trainerWeightUnit = trainer?.weight_unit || WeightUnit.KG;

    // Normalize start date to Monday and compute end date to Sunday
    // meta.startDate is already normalized to UTC midnight by the schema transform
    const mondayStart = startOfWeek(meta.startDate, { weekStartsOn: 1 });
    const endDate = addDays(mondayStart, meta.durationWeeks * 7 - 1); // Sunday of last week

    // Wrap everything in a transaction so either all inserts succeed or none.
    const createdPlan = await prisma.$transaction(async (tx) => {
      // 1. Insert plan skeleton
      const plan = await tx.workout_plans.create({
        data: {
          id: uuidv4(),
          title: meta.title,
          description: meta.description,
          trainer_id: trainerId,
          client_id: meta.clientId,
          start_date: mondayStart,
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
          const dayDate = addDays(mondayStart, (week.weekNumber - 1) * 7 + (day.dayNumber - 1));

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

      return plan;
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