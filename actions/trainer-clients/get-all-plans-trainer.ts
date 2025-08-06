"use server"
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";

const GetAllPlansTrainerSchema = z.object({
  page: z.number().optional().transform((v) => v ?? 0),
  pageSize: z.number().optional().transform((v) => v ?? 5),
});

export const getAllPlansTrainer = createSafeAction(
  GetAllPlansTrainerSchema,
  async (input) => {
    const trainerId = await getAuthenticatedUserId();
    if (!trainerId) return { error: "Unauthorized" };

    const page = input.page;
    const pageSize = input.pageSize;
    const currentDate = new Date();

    // Get total count
    const total = await prisma.workout_plans.count({
      where: {
        trainer_id: trainerId,
      },
    });

    // Get paginated plans (latest first)
    const plans = await prisma.workout_plans.findMany({
      where: {
        trainer_id: trainerId,
      },
      orderBy: { created_at: "desc" },
      skip: (page || 0) * (pageSize || 5),
      take: pageSize || 5,
      select: {
        id: true,
        title: true,
        client_id: true,
        start_date: true,
        end_date: true,
        duration_in_weeks: true,
        category: true,
        description: true,
        created_at: true,
        intensity_mode: true,
        status: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Process plans to add date-based status while retaining original status
    const processedPlans = plans.map(plan => {
      const isExpired = plan.end_date < currentDate;
      const isActive = !isExpired;
      
      return {
        ...plan,
        // Keep original status (DRAFT, PUBLISHED, ARCHIVED)
        status: plan.status,
        // Add date-based status
        dateStatus: isExpired ? "EXPIRED" : "CURRENT",
        isExpired,
        isActive,
      };
    });

    return {
      data: {
        plans: processedPlans,
        total,
        page: page || 0,
        pageSize: pageSize || 5,
        totalPages: Math.ceil(total / (pageSize || 5)),
      },
    };
  }
);

export type GetAllPlansTrainerInput = z.infer<typeof GetAllPlansTrainerSchema>;
