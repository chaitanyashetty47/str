"use server"
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";

const AddBmiSchema = z.object({
  weight: z.number().min(20).max(500),
  height: z.number().min(80).max(250),
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
  async ({ weight, height, saveNewWeight, updateHeight }) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split("T")[0];

    // 1. Insert into calculator_sessions
    const bmi = calculateBMI(weight, height);
    const category = getBmiCategory(bmi);
    const session = await prisma.calculator_sessions.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        category: "BMI",
        date: new Date(todayISO),
        inputs: { weight, height },
        result: bmi,
        result_unit: "BMI score",
        
      },
    });

    //2. Create new weight log entry

    await prisma.weight_logs.create({
      data: { id: crypto.randomUUID(), user_id: userId, weight, date_logged: new Date(todayISO) },
    });

    // 3. Optionally update users_profile weight
    if (saveNewWeight) {
      await prisma.users_profile.update({
        where: { id: userId },
        data: { weight },
      });
      
    }

    // 3. Optionally update user_profiles.height
    if (updateHeight) {
      await prisma.users_profile.update({
        where: { id: userId },
        data: { height },
      });
    }

    return {
      data: {
        date: todayISO,
        weight,
        height,
        bmi,
        category,
      },
    };
  }
);

export type AddBMIInput = z.infer<typeof AddBmiSchema>;
