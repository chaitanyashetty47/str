"use server"
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { stripTimezone } from "@/utils/date-utils";
import { z } from "zod";
import { randomUUID } from "crypto";

const UpdateTodaysWeightSchema = z.object({
  weight: z.number().positive(),
  weightUnit: z.enum(['KG', 'LB']),
});

export const updateTodaysWeight = createSafeAction(
  UpdateTodaysWeightSchema,
  async ({ weight, weightUnit }) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    // Use stripTimezone to ensure consistent date handling regardless of server location
    const today = stripTimezone(new Date());
    
    const existingEntry = await prisma.weight_logs.findUnique({
      where: {
        user_id_date_logged: { user_id: userId, date_logged: today }
      }
    });
    
    if (existingEntry) {
      // Update existing entry (same date)
      await prisma.weight_logs.update({
        where: { id: existingEntry.id },
        data: { 
          weight: weight,
          weight_unit: weightUnit
        }
      });
    } else {
      // Create new entry for today
      await prisma.weight_logs.create({
        data: {
          id: randomUUID(),
          user_id: userId,
          weight: weight,
          weight_unit: weightUnit,
          date_logged: today
        }
      });
    }

    return { data: { success: true } };
  }
); 