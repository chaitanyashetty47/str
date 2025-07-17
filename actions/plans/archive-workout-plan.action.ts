'use server';
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { WorkoutPlanStatus } from "@prisma/client";

const InputSchema = z.object({
  id: z.string().uuid(),
  archive: z.boolean(),
});

export type ArchiveWorkoutPlanInput = z.infer<typeof InputSchema>;
export type ArchiveWorkoutPlanOutput = { ok: boolean };

async function handler({ id, archive }: ArchiveWorkoutPlanInput) {
  try {
    await prisma.workout_plans.update({
      where: { id },
      data: {
        status: archive ? WorkoutPlanStatus.ARCHIVED : WorkoutPlanStatus.DRAFT,
      },
    });
    return { data: { ok: true } };
  } catch (e: any) {
    return { error: e.message };
  }
}

export const archiveWorkoutPlan = createSafeAction<ArchiveWorkoutPlanInput, ArchiveWorkoutPlanOutput>(
  InputSchema,
  handler,
); 