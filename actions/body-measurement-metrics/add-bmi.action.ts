"use server"
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { WeightUnit } from "@prisma/client";
import { convertToKg } from "@/utils/weight";

const AddBmiSchema = z.object({
  weight: z.number().min(20).max(500),
  height: z.number().min(80).max(250),
  userWeightUnit: z.nativeEnum(WeightUnit),
  clientDate: z.string(), // Client sends current date in YYYY-MM-DD format
  saveNewWeight: z.boolean().optional(),
  updateHeight: z.boolean().optional(),
});

function calculateBMI(weight: number, height: number) {
  return Number((weight / ((height / 100) ** 2)).toFixed(1));
}

function getBmiCategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export const addBMI = createSafeAction(
  AddBmiSchema,
  async ({ weight, height, userWeightUnit, clientDate, saveNewWeight = false, updateHeight = false }) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    // Store the client date directly - this preserves their local date exactly
    // The @db.Date type will handle the date storage without timezone issues
    const today = new Date(clientDate);

    // Convert weight to KG if user input is in LBS
    // This ensures all database records are stored in KG for consistency
    const weightInKg = userWeightUnit === WeightUnit.KG ? weight : convertToKg(weight, WeightUnit.LB);

    // 1. Insert into calculator_sessions
    const bmi = calculateBMI(weightInKg, height);
    const category = getBmiCategory(bmi);
    const session = await prisma.calculator_sessions.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        category: "BMI",
        date: today, // This will store exactly as client intended (11 Aug = 11 Aug)
        inputs: { 
          weight: weightInKg, // Store converted weight in KG
          originalWeight: weight, // Store original weight in user's unit
          height, 
          userWeightUnit // Store the unit user was using for reference
        },
        result: bmi,
        result_unit: "BMI score",
      },
    });

    // 2. Create new weight log entry (always in KG)
    await prisma.weight_logs.create({
      data: { 
        id: crypto.randomUUID(), 
        user_id: userId, 
        weight: weightInKg, // Store converted weight in KG
        weight_unit: WeightUnit.KG, // Always store in KG
        date_logged: today // This will also store exactly as client intended
      },
    });

    // 3. Optionally update users_profile weight (always in KG)
    if (saveNewWeight) {
      await prisma.users_profile.update({
        where: { id: userId },
        data: { weight: weightInKg }, // Store converted weight in KG
      });
    }

    // 4. Optionally update user_profiles.height
    if (updateHeight) {
      await prisma.users_profile.update({
        where: { id: userId },
        data: { height },
      });
    }

    return {
      data: {
        date: clientDate,
        weight: weightInKg, // Return converted weight in KG
        originalWeight: weight, // Return original weight in user's unit
        height,
        bmi,
        category,
        userWeightUnit, // Return the unit user was using
      },
    };
  }
);

export type AddBMIInput = z.infer<typeof AddBmiSchema>;
