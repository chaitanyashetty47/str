"use server"
import { createSafeAction } from "@/lib/create-safe-action";
import { getAuthenticatedUserId } from "@/utils/user";
import { z } from "zod";
import { Gender, ActivityLevel, WeightUnit } from "@prisma/client";
import { convertToKG } from "@/utils/weight-conversions";

const CalculateBMRSchema = z.object({
  weight: z.number().positive(),
  height: z.number().positive(),
  age: z.number().positive(),
  gender: z.nativeEnum(Gender),
  activityLevel: z.nativeEnum(ActivityLevel),
  weightUnit: z.nativeEnum(WeightUnit),
});

export interface BMRResult {
  bmr: number;
  dailyCalories: number;
  weight: number;
  height: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
}

// Calculate BMR using Mifflin-St Jeor Equation
function calculateBMR(weight: number, height: number, age: number, gender: Gender): number {
  if (gender === Gender.MALE) {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
}

// Calculate daily calorie needs based on activity level
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

export const calculateBMRAction = createSafeAction(
  CalculateBMRSchema,
  async ({ weight, height, age, gender, activityLevel, weightUnit }) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    // Convert weight to KG for calculations
    const weightInKG = convertToKG(weight, weightUnit);
    
    // Calculate BMR and daily calories
    const bmr = calculateBMR(weightInKG, height, age, gender);
    const dailyCalories = calculateDailyCalories(bmr, activityLevel);

    const result: BMRResult = {
      bmr: Math.round(bmr * 100) / 100, // Round to 2 decimal places
      dailyCalories: Math.round(dailyCalories * 100) / 100,
      weight: weightInKG, // Return weight in KG for consistency
      height,
      age,
      gender,
      activityLevel
    };

    return { data: result };
  }
);