'use server';

import { WeightUnit } from "@prisma/client";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";

export async function getWeightUnit(): Promise<WeightUnit> {
  try {
    const userId = await getAuthenticatedUserId();
    
    if (!userId) {
      // Default to KG if not authenticated
      return WeightUnit.KG;
    }

    const userProfile = await prisma.users_profile.findUnique({
      where: { id: userId },
      select: { weight_unit: true },
    });

    return userProfile?.weight_unit || WeightUnit.KG;
  } catch (error) {
    console.error("Error fetching weight unit:", error);
    // Default to KG on error
    return WeightUnit.KG;
  }
} 