import prisma from "@/utils/prisma/prismaClient";
import { randomUUID } from "crypto";

export interface WeightData {
  weight: number;
  source: 'weight_logs' | 'profile';
  isLocked: boolean;
  weightUnit: 'KG' | 'LB';
}

/**
 * Fetches today's weight for a user, prioritizing weight_logs over profile weight
 */
export async function getTodaysWeight(userId: string): Promise<WeightData> {
  const today = new Date().toISOString().split('T')[0];
  
  // First priority: Check if weight already logged today
  const todaysWeightLog = await prisma.weight_logs.findUnique({
    where: {
      user_id_date_logged: { user_id: userId, date_logged: new Date(today) }
    }
  });
  
  if (todaysWeightLog) {
    return {
      weight: todaysWeightLog.weight,
      source: 'weight_logs',
      isLocked: true, // Cannot be changed for this date
      weightUnit: todaysWeightLog.weight_unit
    };
  }
  
  // Second priority: Use profile weight as default
  const userProfile = await prisma.users_profile.findUnique({
    where: { id: userId },
    select: { weight: true, weight_unit: true }
  });
  
  return {
    weight: userProfile?.weight || 0,
    source: 'profile',
    isLocked: false, // Can be saved to weight_logs
    weightUnit: userProfile?.weight_unit || 'KG'
  };
}

/**
 * Updates or creates today's weight entry
 */
export async function updateTodaysWeight(
  userId: string, 
  newWeight: number, 
  weightUnit: 'KG' | 'LB' = 'KG'
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  const existingEntry = await prisma.weight_logs.findUnique({
    where: {
      user_id_date_logged: { user_id: userId, date_logged: new Date(today) }
    }
  });
  
  if (existingEntry) {
    // Update existing entry (same date)
    await prisma.weight_logs.update({
      where: { id: existingEntry.id },
      data: { 
        weight: newWeight,
        weight_unit: weightUnit
      }
    });
  } else {
    // Create new entry for today
    await prisma.weight_logs.create({
      data: {
        id: randomUUID(),
        user_id: userId,
        weight: newWeight,
        weight_unit: weightUnit,
        date_logged: new Date(today)
      }
    });
  }
}

/**
 * Converts weight to KG if it's in LB
 */
export function convertToKG(weight: number, unit: 'KG' | 'LB'): number {
  if (unit === 'LB') {
    return weight * 0.453592;
  }
  return weight;
}

/**
 * Converts weight from KG to specified unit
 */
export function convertFromKG(weightKG: number, targetUnit: 'KG' | 'LB'): number {
  if (targetUnit === 'LB') {
    return weightKG * 2.20462;
  }
  return weightKG;
}
