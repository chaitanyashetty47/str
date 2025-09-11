"use server"
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { WeightUnit, Gender } from "@prisma/client";
import { convertToKg } from "@/utils/weight";

const AddBodyFatSchema = z.object({
  height: z.number().min(100).max(250), // Height in cm (100cm = 3'3", 250cm = 8'2")
  waist: z.number().min(50).max(200), // Realistic minimum for adults
  neck: z.number().min(25).max(60),
  hips: z.number().min(70).max(200).optional(), // Required for women
  gender: z.nativeEnum(Gender),
  clientDate: z.string(), // Client sends current date in YYYY-MM-DD format
});

// Navy Body Fat Formula
function calculateBodyFatNavy(
  height: number,
  waist: number,
  neck: number,
  gender: Gender,
  hips?: number
): { bodyFatPercentage: number } | { error: string } {
  let bodyFatPercentage: number;

  if (gender === Gender.MALE) {
    // Navy formula for men: %BF = 495 / (1.0324 − 0.19077 × log10(waist − neck) + 0.15456 × log10(height)) − 450
    const waistNeckDiff = waist - neck;
    if (waistNeckDiff <= 0) {
      return { error: `Invalid measurements: Waist (${waist}cm) must be larger than neck (${neck}cm) for accurate calculation.` };
    }
    
    const logWaistNeck = Math.log10(waistNeckDiff);
    const logHeight = Math.log10(height);
    
    bodyFatPercentage = 495 / (1.0324 - 0.19077 * logWaistNeck + 0.15456 * logHeight) - 450;
  } else {
    // Navy formula for women: %BF = 495 / (1.29579 − 0.35004 × log10(waist + hip − neck) + 0.22100 × log10(height)) − 450
    if (!hips) {
      return { error: "Hip measurement is required for women." };
    }
    
    const waistHipNeckSum = waist + hips - neck;
    if (waistHipNeckSum <= 0) {
      return { error: `Invalid measurements: (Waist + Hips - Neck) must be positive. Current: ${waist} + ${hips} - ${neck} = ${waistHipNeckSum}` };
    }
    
    const logWaistHipNeck = Math.log10(waistHipNeckSum);
    const logHeight = Math.log10(height);
    
    bodyFatPercentage = 495 / (1.29579 - 0.35004 * logWaistHipNeck + 0.22100 * logHeight) - 450;
  }

  // Validate that the result is realistic
  if (bodyFatPercentage < 0) {
    return { error: `Invalid result: Body fat percentage cannot be negative (${bodyFatPercentage.toFixed(1)}%). Please check your measurements.` };
  }
  
  if (bodyFatPercentage > 50) {
    return { error: `Invalid result: Body fat percentage seems too high (${bodyFatPercentage.toFixed(1)}%). Please check your measurements.` };
  }

  return {
    bodyFatPercentage: Math.round(bodyFatPercentage * 10) / 10, // Round to 1 decimal
  };
}

// Body fat categories based on Navy standards
function getBodyFatCategory(bodyFatPercentage: number, gender: Gender): string {
  if (gender === Gender.MALE) {
    if (bodyFatPercentage < 6) return "Essential";
    if (bodyFatPercentage < 14) return "Athletes";
    if (bodyFatPercentage < 18) return "Fitness";
    if (bodyFatPercentage < 22) return "Average";
    if (bodyFatPercentage < 26) return "Above Average";
    return "Obese";
  } else {
    if (bodyFatPercentage < 14) return "Essential";
    if (bodyFatPercentage < 21) return "Athletes";
    if (bodyFatPercentage < 25) return "Fitness";
    if (bodyFatPercentage < 32) return "Average";
    if (bodyFatPercentage < 36) return "Above Average";
    return "Obese";
  }
}

export const addBodyFat = createSafeAction(
  AddBodyFatSchema,
  async ({ height, waist, neck, hips, gender, clientDate }) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    // Store the client date directly - this preserves their local date exactly
    const today = new Date(clientDate);

    // Calculate body fat using Navy formula
    const result = calculateBodyFatNavy(
      height,
      waist,
      neck,
      gender,
      hips
    );

    // Check if calculation returned an error
    if ('error' in result) {
      return { error: result.error };
    }

    const { bodyFatPercentage } = result;

    const category = getBodyFatCategory(bodyFatPercentage, gender);

    // Insert into calculator_sessions
    const session = await prisma.calculator_sessions.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        category: "BODY_FAT",
        date: today,
        inputs: { 
          height,
          waist,
          neck,
          hips,
          gender
        },
        result: bodyFatPercentage,
        result_unit: "%",
      },
    });

    return {
      data: {
        date: clientDate,
        height,
        waist,
        neck,
        hips,
        gender,
        bodyFatPercentage,
        category,
      },
    };
  }
);

export type AddBodyFatInput = z.infer<typeof AddBodyFatSchema>; 