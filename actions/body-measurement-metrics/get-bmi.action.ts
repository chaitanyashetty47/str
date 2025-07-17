"use server"
import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";

const GetBmiSchema = z.object({
  page: z.number().optional().transform((v) => v ?? 0),
  pageSize: z.number().optional().transform((v) => v ?? 5),
});

export const getBMI = createSafeAction(
  GetBmiSchema,
  async (input) => {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Unauthorized" };

    const page = input.page;
    const pageSize = input.pageSize;

    // Get total count
    const total = await prisma.calculator_sessions.count({
      where: {
        user_id: userId,
        category: "BMI",
      },
    });

    // Get paginated entries (latest first)
    const entries = await prisma.calculator_sessions.findMany({
      where: {
        user_id: userId,
        category: "BMI",
      },
      orderBy: { date: "desc" },
      skip: (page || 0) * (pageSize || 5),
      take: pageSize || 5,
      select: {
        date: true,
        inputs: true,
        result: true,
        result_unit: true,
        category: true,
      },
    });

    // Get latest entry
    let latest = null;
    if (entries.length > 0) {
      latest = entries[0];
    } else {
      latest = await prisma.calculator_sessions.findFirst({
        where: {
          user_id: userId,
          category: "BMI",
        },
        orderBy: { date: "desc" },
        select: {
          date: true,
          inputs: true,
          result: true,
          result_unit: true,
          category: true,
        },
      });
    }

    // Normalize entries with type guard for inputs
    const normalized = entries.map(e => {
      const inputs = (typeof e.inputs === 'object' && e.inputs !== null) ? e.inputs as any : {};
      return {
        date: e.date,
        weight: inputs.weight ?? null,
        height: inputs.height ?? null,
        bmi: e.result,
        category: e.category,
      };
    });

    let latestNormalized = null;
    if (latest) {
      const inputs = (typeof latest.inputs === 'object' && latest.inputs !== null) ? latest.inputs as any : {};
      latestNormalized = {
        date: latest.date,
        weight: inputs.weight ?? null,
        height: inputs.height ?? null,
        bmi: latest.result,
        category: latest.category,
      };
    }

    return {
      data: {
        entries: normalized,
        total,
        latest: latestNormalized,
      },
    };
  }
);

export type GetBMIInput = z.infer<typeof GetBmiSchema>;
