"use server"
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";

const GetBodyFatSchema = z.object({
  page: z.number().min(0),
  pageSize: z.number().min(1).max(100),
});

export const getBodyFat = createSafeAction(
  GetBodyFatSchema,
  async ({ page, pageSize }) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    try {
      // Get total count
      const total = await prisma.calculator_sessions.count({
        where: {
          user_id: userId,
          category: "BODY_FAT",
        },
      });

      // Get paginated entries
      const entries = await prisma.calculator_sessions.findMany({
        where: {
          user_id: userId,
          category: "BODY_FAT",
        },
        orderBy: {
          date: "desc",
        },
        skip: page * pageSize,
        take: pageSize,
      });

      // Get latest entry
      const latest = await prisma.calculator_sessions.findFirst({
        where: {
          user_id: userId,
          category: "BODY_FAT",
        },
        orderBy: {
          date: "desc",
        },
      });

      return {
        data: {
          entries: entries.map(entry => ({
            id: entry.id,
            date: entry.date,
            bodyFatPercentage: entry.result,
            inputs: entry.inputs as any,
            result_unit: entry.result_unit,
          })),
          total,
          latest: latest ? {
            id: latest.id,
            date: latest.date,
            bodyFatPercentage: latest.result,
            inputs: latest.inputs as any,
            result_unit: latest.result_unit,
          } : null,
        },
      };
    } catch (error) {
      console.error("Error fetching body fat data:", error);
      return { error: "Failed to fetch body fat data" };
    }
  }
);

export type GetBodyFatInput = z.infer<typeof GetBodyFatSchema>; 