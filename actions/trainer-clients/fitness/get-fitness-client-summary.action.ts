"use server";

import { createSafeAction } from "@/lib/create-safe-action";
import { z } from "zod";
import prisma from "@/utils/prisma/prismaClient";
import { validateServerRole } from "@/lib/server-role-validation";
import { BodyPart } from "@prisma/client";

const getFitnessClientSummarySchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
});

type GetFitnessClientSummaryInput = z.infer<typeof getFitnessClientSummarySchema>;

interface ClientProfile {
  id: string;
  name: string;
  height?: number | null;
  weight?: number | null;
  neck?: number | null;
  waist?: number | null;
  hips?: number | null;
  gender?: string | null;
}

interface BestPR {
  id: string;
  exerciseName: string;
  exerciseType: BodyPart;
  maxWeight?: number | null;
  maxReps?: number | null;
  exerciseTypeEnum: "WEIGHT_BASED" | "REPS_BASED";
  dateAchieved: Date;
}

interface ClientFitnessSummary {
  profile: ClientProfile;
  bestPRs: BestPR[];
  uniqueBodyParts: BodyPart[];
}

export const getFitnessClientSummary = createSafeAction(
  getFitnessClientSummarySchema,
  async ({ clientId }: GetFitnessClientSummaryInput): Promise<{
    data?: ClientFitnessSummary;
    error?: string;
  }> => {
    try {
      // Validate user authentication and FITNESS_TRAINER/FITNESS_TRAINER_ADMIN role
      await validateServerRole(['FITNESS_TRAINER', 'FITNESS_TRAINER_ADMIN']);

      // Get client profile data
      const profile = await prisma.users_profile.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          gender: true,
          height: true,
          weight: true,
          neck: true,
          waist: true,
          hips: true,
        },
      });

      if (!profile) {
        return { error: "Client profile not found" };
      }

      // Get all max lifts for the client with exercise details
      const allMaxLifts = await prisma.client_max_lifts.findMany({
        where: { client_id: clientId },
        include: {
          workout_exercise_lists: true,
        },
        orderBy: { date_achieved: 'desc' },
      });

      // Group by exercise and get the best PR for each exercise
      const exerciseBestPRs = allMaxLifts.reduce((acc, lift) => {
        const exerciseKey = lift.workout_exercise_lists.name;
        
        if (!acc[exerciseKey]) {
          acc[exerciseKey] = {
            id: lift.id,
            exerciseName: lift.workout_exercise_lists.name,
            exerciseType: lift.workout_exercise_lists.type,
            maxWeight: lift.max_weight,
            maxReps: lift.max_reps,
            exerciseTypeEnum: lift.exercise_type,
            dateAchieved: lift.date_achieved,
          };
        } else {
          // Compare and keep the better PR
          const currentBest = acc[exerciseKey];
          const isCurrentBetter = lift.exercise_type === "REPS_BASED"
            ? (lift.max_reps ?? 0) > (currentBest.maxReps ?? 0)
            : (lift.max_weight ?? 0) > (currentBest.maxWeight ?? 0);
          
          if (isCurrentBetter) {
            acc[exerciseKey] = {
              id: lift.id,
              exerciseName: lift.workout_exercise_lists.name,
              exerciseType: lift.workout_exercise_lists.type,
              maxWeight: lift.max_weight,
              maxReps: lift.max_reps,
              exerciseTypeEnum: lift.exercise_type,
              dateAchieved: lift.date_achieved,
            };
          }
        }
        
        return acc;
      }, {} as Record<string, BestPR>);

      // Convert to array and sort by date (newest first)
      const bestPRs = Object.values(exerciseBestPRs)
        .sort((a, b) => new Date(b.dateAchieved).getTime() - new Date(a.dateAchieved).getTime());

      // Get unique body parts
      const uniqueBodyParts = Array.from(
        new Set(bestPRs.map(pr => pr.exerciseType))
      ) as BodyPart[];

      return {
        data: {
          profile,
          bestPRs,
          uniqueBodyParts,
        },
      };
    } catch (error) {
      console.error("Error fetching client fitness summary:", error);
      return { error: "Failed to fetch client fitness summary" };
    }
  }
);
