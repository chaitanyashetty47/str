"use server"
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { z } from "zod";

// No input needed
const IsTodayLoggedSchema = z.void();

export const isTodayLogged = createSafeAction(
  IsTodayLoggedSchema,
  async () => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split("T")[0];

    const entry = await prisma.calculator_sessions.findFirst({
      where: {
        user_id: userId,
        category: "BMI",
        date: new Date(todayISO),
      },
      select: { id: true },
    });

    return { data: { isTodayLogged: !!entry } };
  }
); 