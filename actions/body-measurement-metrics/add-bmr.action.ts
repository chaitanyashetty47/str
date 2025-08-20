"use server"
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { WeightUnit, ActivityLevel, Gender } from "@prisma/client";
import { convertToKg } from "@/utils/weight";

const AddBMRSchema = z.object({
  weight: z.number().min(20).max(500),
  height: z.number().min(80).max(250),
  age: z.number().min(10).max(120),
  gender: z.nativeEnum(Gender),
  activityLevel: z.nativeEnum(ActivityLevel),
  userWeightUnit: z.nativeEnum(WeightUnit),
  clientDate: z.string(), // Client sends current date in YYYY-MM-DD format
  saveNewWeight: z.boolean().optional(),
});

// Calculate BMR using Mifflin-St Jeor Equation
function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
  if (gender === Gender.MALE) {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
}

// Calculate daily calories based on activity level
function calculateDailyCalories(bmr: number, activityLevel: ActivityLevel): number {
  const multipliers = {
    [ActivityLevel.SEDENTARY]: 1.2,
    [ActivityLevel.LIGHTLY_ACTIVE]: 1.375,
    [ActivityLevel.MODERATELY_ACTIVE]: 1.55,
    [ActivityLevel.VERY_ACTIVE]: 1.725,
    [ActivityLevel.EXTRA_ACTIVE]: 1.9
  };
  
  return bmr * multipliers[activityLevel];
}

export const addBMR = createSafeAction(
  AddBMRSchema,
  async ({ weight, height, age, gender, activityLevel, userWeightUnit, clientDate, saveNewWeight = false }) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    // Store the client date directly - this preserves their local date exactly
    // The @db.Date type will handle the date storage without timezone issues
    const today = new Date(clientDate);

    // Convert weight to KG if user input is in LBS
    // This ensures all database records are stored in KG for consistency
    const weightInKg = userWeightUnit === WeightUnit.KG ? weight : convertToKg(weight, WeightUnit.LB);

    // Calculate BMR and daily calories
    const bmr = calculateBMR(weightInKg, height, age, gender);
    const dailyCalories = calculateDailyCalories(bmr, activityLevel);

    // 1. Insert into calculator_sessions
    const session = await prisma.calculator_sessions.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        category: "BMR",
        date: today, // This will store exactly as client intended (11 Aug = 11 Aug)
        inputs: { 
          weight: weightInKg, // Store converted weight in KG
          originalWeight: weight, // Store original weight in user's unit
          height, 
          age,
          gender,
          activityLevel,
          userWeightUnit // Store the unit user was using for reference
        },
        result: bmr,
        result_unit: "calories/day",
      },
    });

    // 2. If user chose to save new weight, update weight_logs
    if (saveNewWeight) {
      // Check if weight already logged today
      const existingEntry = await prisma.weight_logs.findUnique({
        where: {
          user_id_date_logged: { user_id: userId, date_logged: today }
        }
      });
      
      if (existingEntry) {
        // Update existing entry
        await prisma.weight_logs.update({
          where: { id: existingEntry.id },
          data: { weight: weightInKg }
        });
      } else {
        // Create new entry
        await prisma.weight_logs.create({
          data: { 
            id: crypto.randomUUID(), 
            user_id: userId, 
            weight: weightInKg, // Store converted weight in KG
            weight_unit: WeightUnit.KG, // Always store in KG
            date_logged: today // This will also store exactly as client intended
          },
        });
      }
    }

    return {
      data: {
        date: clientDate,
        weight: weightInKg, // Return converted weight in KG
        originalWeight: weight, // Return original weight in user's unit
        height,
        age,
        gender,
        activityLevel,
        bmr,
        dailyCalories,
        userWeightUnit, // Return the unit user was using
      },
    };
  }
);

export type AddBMRInput = z.infer<typeof AddBMRSchema>;
