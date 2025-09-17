"use server"
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { z } from "zod";
// import { randomUUID } from "crypto";

const UpdateTodaysWeightSchema = z.object({
  weight: z.number().min(20).max(500),
  weightUnit: z.enum(['KG', 'LB']),
  clientDate: z.string(), // Client sends current date in YYYY-MM-DD format
});

export const updateTodaysWeight = createSafeAction(
  UpdateTodaysWeightSchema,
  async ({ weight, weightUnit, clientDate }) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    // Store the client date directly - this preserves their local date exactly
    // The @db.Date type will handle the date storage without timezone issues
    const today = new Date(clientDate);
    
    // Upsert weight log entry
    await prisma.weight_logs.upsert({
      where: {
        user_id_date_logged: { 
          user_id: userId, 
          date_logged: today 
        }
      },
      update: {
        weight: weight, // Update with new weight
        weight_unit: weightUnit, // Update with new unit
      },
      create: {
        //id: randomUUID(), 
        user_id: userId, 
        weight: weight, // Store weight in user's preferred unit
        weight_unit: weightUnit, // Store user's preferred unit
        date_logged: today // This will store exactly as client intended
      },
    });

    return { data: { success: true } };
  }
); 