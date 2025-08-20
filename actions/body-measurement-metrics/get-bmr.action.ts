"use server"
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";

const GetBMRSchema = z.object({
  page: z.number().optional().transform((v) => v ?? 0),
  pageSize: z.number().optional().transform((v) => v ?? 5),
});

// Calculate daily calories based on activity level
function calculateDailyCalories(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    "SEDENTARY": 1.2,
    "LIGHTLY_ACTIVE": 1.375,
    "MODERATELY_ACTIVE": 1.55,
    "VERY_ACTIVE": 1.725,
    "EXTRA_ACTIVE": 1.9
  };
  
  return bmr * (multipliers[activityLevel] || 1.2);
}

export const getBMR = createSafeAction(
  GetBMRSchema,
  async (input) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    const page = input.page;
    const pageSize = input.pageSize;

    // Get total count
    const total = await prisma.calculator_sessions.count({
      where: {
        user_id: userId,
        category: "BMR",
      },
    });

    // Get paginated entries (latest first)
    const entries = await prisma.calculator_sessions.findMany({
      where: {
        user_id: userId,
        category: "BMR",
      },
      orderBy: { date: "desc" },
      skip: (page || 0) * (pageSize || 5),
      take: pageSize || 5,
      select: {
        date: true,
        inputs: true,
        result: true,
        result_unit: true,
        category: true,
      },
    });

    // Get latest entry
    let latest = null;
    if (entries.length > 0) {
      latest = entries[0];
    } else {
      latest = await prisma.calculator_sessions.findFirst({
        where: {
          user_id: userId,
          category: "BMR",
        },
        orderBy: { date: "desc" },
        select: {
          date: true,
          inputs: true,
          result: true,
          result_unit: true,
          category: true,
        },
      });
    }

    // Normalize entries with type guard for inputs
    const normalized = entries.map(e => {
      const inputs = (typeof e.inputs === 'object' && e.inputs !== null) ? e.inputs as any : {};
      const bmr = e.result;
      const dailyCalories = calculateDailyCalories(bmr, inputs.activityLevel);
      
      return {
        date: e.date,
        weight: inputs.weight ?? null,
        height: inputs.height ?? null,
        age: inputs.age ?? null,
        gender: inputs.gender ?? null,
        activityLevel: inputs.activityLevel ?? null,
        bmr: bmr,
        dailyCalories: dailyCalories,
        category: e.category,
      };
    });

    let latestNormalized = null;
    if (latest) {
      const inputs = (typeof latest.inputs === 'object' && latest.inputs !== null) ? latest.inputs as any : {};
      const bmr = latest.result;
      const dailyCalories = calculateDailyCalories(bmr, inputs.activityLevel);
      
      latestNormalized = {
        date: latest.date,
        weight: inputs.weight ?? null,
        height: inputs.height ?? null,
        age: inputs.age ?? null,
        gender: inputs.gender ?? null,
        activityLevel: inputs.activityLevel ?? null,
        bmr: bmr,
        dailyCalories: dailyCalories,
        category: latest.category,
      };
    }

    return {
      data: {
        entries: normalized,
        total,
        latest: latestNormalized,
      },
    };
  }
);

export type GetBMRInput = z.infer<typeof GetBMRSchema>;
