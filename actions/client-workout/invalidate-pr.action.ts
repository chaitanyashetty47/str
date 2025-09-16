"use server";

import { prisma } from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { createSafeAction } from "@/lib/create-safe-action";
import { z } from "zod";

const invalidatePrSchema = z.object({
  prId: z.string().uuid("Invalid PR ID"),
});

type InvalidatePrInput = z.infer<typeof invalidatePrSchema>;

export const invalidatePr = createSafeAction(
  invalidatePrSchema,
  async ({ prId }: InvalidatePrInput) => {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return {
        error: "User not authenticated",
      };
    }

    try {
      // Verify the PR belongs to the authenticated user
      const existingPr = await prisma.client_max_lifts.findFirst({
        where: {
          id: prId,
          client_id: userId,
        },
      });

      if (!existingPr) {
        return {
          error: "Personal record not found or you don't have permission to modify it",
        };
      }

      // Check if already invalidated
      if (existingPr.is_invalid) {
        return {
          error: "This personal record is already invalidated",
        };
      }

      // Invalidate the PR
      const invalidatedPr = await prisma.client_max_lifts.update({
        where: {
          id: prId,
        },
        data: {
          is_invalid: true,
          last_updated: new Date(),
        },
        include: {
          workout_exercise_lists: {
            select: {
              name: true,
            },
          },
        },
      });

      return {
        data: {
          success: true,
          message: `Personal record for ${invalidatedPr.workout_exercise_lists.name} has been invalidated`,
          prId: invalidatedPr.id,
        },
      };
    } catch (error) {
      console.error("Error invalidating PR:", error);
      return {
        error: "Failed to invalidate personal record. Please try again.",
      };
    }
  }
);

// Optional: Restore invalidated PR action
export const restorePr = createSafeAction(
  invalidatePrSchema,
  async ({ prId }: InvalidatePrInput) => {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      return {
        error: "User not authenticated",
      };
    }

    try {
      // Verify the PR belongs to the authenticated user
      const existingPr = await prisma.client_max_lifts.findFirst({
        where: {
          id: prId,
          client_id: userId,
        },
      });

      if (!existingPr) {
        return {
          error: "Personal record not found or you don't have permission to modify it",
        };
      }

      // Check if already valid
      if (!existingPr.is_invalid) {
        return {
          error: "This personal record is already valid",
        };
      }

      // Restore the PR
      const restoredPr = await prisma.client_max_lifts.update({
        where: {
          id: prId,
        },
        data: {
          is_invalid: false,
          last_updated: new Date(),
        },
        include: {
          workout_exercise_lists: {
            select: {
              name: true,
            },
          },
        },
      });

      return {
        data: {
          success: true,
          message: `Personal record for ${restoredPr.workout_exercise_lists.name} has been restored`,
          prId: restoredPr.id,
        },
      };
    } catch (error) {
      console.error("Error restoring PR:", error);
      return {
        error: "Failed to restore personal record. Please try again.",
      };
    }
  }
);