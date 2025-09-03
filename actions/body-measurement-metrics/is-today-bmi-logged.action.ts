"use server"
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { z } from "zod";

// Accept client date to avoid timezone issues
const IsTodayLoggedSchema = z.object({
  clientDate: z.string(), // Client sends current date in YYYY-MM-DD format
});

export const isTodayLogged = createSafeAction(
  IsTodayLoggedSchema,
  async ({ clientDate }) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    // Use the client's date directly - no timezone conversion needed
    const today = new Date(clientDate);

    const entry = await prisma.calculator_sessions.findFirst({
      where: {
        user_id: userId,
        category: "BMI",
        date: today, // Use client's date directly
      },
      select: { id: true },
    });

    return { data: { isTodayLogged: !!entry } };
  }
); 