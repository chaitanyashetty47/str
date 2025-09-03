"use server"
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { stripTimezone } from "@/utils/date-utils";
import { z } from "zod";

const GetTodaysWeightSchema = z.object({});

export interface WeightData {
  weight: number;
  source: 'weight_logs' | 'profile';
  isLocked: boolean;
  weightUnit: 'KG' | 'LB';
}

export const getTodaysWeight = createSafeAction(
  GetTodaysWeightSchema,
  async () => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    // Use stripTimezone to ensure consistent date handling regardless of server location
    const today = stripTimezone(new Date());
    
    // First priority: Check if weight already logged today
    const todaysWeightLog = await prisma.weight_logs.findUnique({
      where: {
        user_id_date_logged: { user_id: userId, date_logged: today }
      }
    });
    
    if (todaysWeightLog) {
      return {
        data: {
          weight: todaysWeightLog.weight,
          source: 'weight_logs',
          isLocked: true, // Cannot be changed for this date
          weightUnit: todaysWeightLog.weight_unit
        } as WeightData
      };
    }
    
    // Second priority: Use profile weight as default
    const userProfile = await prisma.users_profile.findUnique({
      where: { id: userId },
      select: { weight: true, weight_unit: true }
    });
    
    return {
      data: {
        weight: userProfile?.weight || 0,
        source: 'profile',
        isLocked: false, // Can be saved to weight_logs
        weightUnit: userProfile?.weight_unit || 'KG'
      } as WeightData
    };
  }
); 