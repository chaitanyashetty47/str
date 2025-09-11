"use server"
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";

const IsTodayBodyFatLoggedSchema = z.object({
  clientDate: z.string(), // Client sends current date in YYYY-MM-DD format
});

export const isTodayBodyFatLogged = createSafeAction(
  IsTodayBodyFatLoggedSchema,
  async ({ clientDate }) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    try {
      // Convert client date to Date object
      const today = new Date(clientDate);

      // Check if body fat has been logged today
      const existingEntry = await prisma.calculator_sessions.findFirst({
        where: {
          user_id: userId,
          category: "BODY_FAT",
          date: today,
        },
      });

      return {
        data: {
          isTodayLogged: !!existingEntry,
        },
      };
    } catch (error) {
      console.error("Error checking if body fat logged today:", error);
      return { error: "Failed to check if body fat logged today" };
    }
  }
);

export type IsTodayBodyFatLoggedInput = z.infer<typeof IsTodayBodyFatLoggedSchema>; 