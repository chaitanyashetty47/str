"use server"
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { stripTimezone } from "@/utils/date-utils";
import { z } from "zod";

// Accept client date to avoid timezone issues
const IsTodayWeightLoggedSchema = z.object({
  clientDate: z.string(), // Client sends current date in YYYY-MM-DD format
});

export const isTodayWeightLogged = createSafeAction(
  IsTodayWeightLoggedSchema,
  async ({ clientDate }) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    // Use stripTimezone to ensure consistent date handling regardless of server location
    const today = new Date(clientDate);

    console.log("Today's Date is: ", today);

    const entry = await prisma.weight_logs.findFirst({
      where: {
        user_id: userId,
        date_logged: today, // Use client's date directly
      },
      select: { id: true },
    });

    return { data: { isTodayWeightLogged: !!entry } };
  }
); 