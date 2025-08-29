'use server';
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { WorkoutPlanStatus } from "@prisma/client";
import { requireTrainerAccess } from "@/utils/user";

const InputSchema = z.object({
  id: z.string().uuid(),
  archive: z.boolean(),
});

export type ArchiveWorkoutPlanInput = z.infer<typeof InputSchema>;
export type ArchiveWorkoutPlanOutput = { ok: boolean };

async function handler({ id, archive }: ArchiveWorkoutPlanInput) {
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

    // Ensure the authenticated trainer can only archive their own plans
    if (authenticatedUserId !== existingPlan.trainer_id) {
      throw new Error("You can only archive your own workout plans");
    }

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