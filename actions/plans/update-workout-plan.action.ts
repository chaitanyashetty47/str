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
// Handler
// ────────────────────────────────────────────────────────────────────────────
async function handler({ id, meta, weeks }: UpdateWorkoutPlanInput) {
  try {
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

      // 2. Remove existing nested structure (cascade will clean sets & exercises)
      await tx.workout_days.deleteMany({ where: { plan_id: id } });

      // 3. Re-insert days → exercises → sets based on incoming weeks
      for (const week of weeks) {
        for (const day of week.days) {
          const dayId = uuidv4();
          const dayDate = addDays(mondayStart, (week.weekNumber - 1) * 7 + (day.dayNumber - 1));

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
    });

    return { data: { ok: true } };
  } catch (e: any) {
    return { error: e.message };
  }
}

export const updateWorkoutPlan = createSafeAction<UpdateWorkoutPlanInput, UpdateWorkoutPlanOutput>(
  InputSchema,
  handler,
); 