"use server"

import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { Prisma, Role } from "@prisma/client";

const GetAdminTrainersSchema = z.object({
  page: z.number().optional().transform((v) => v ?? 0),
  pageSize: z.number().optional().transform((v) => v ?? 10),
  search: z.string().optional().transform((v) => v ?? ""),
  category: z.enum(["ALL", "FITNESS", "PSYCHOLOGY", "MANIFESTATION"]).optional().transform((v) => v ?? "ALL"),
});

export const getAdminTrainers = createSafeAction(
  GetAdminTrainersSchema,
  async (input) => {
    const adminId = await getAuthenticatedUserId();
    if (!adminId) return { error: "Unauthorized" };

    const { page, pageSize, search, category } = input;
    const skip = (page || 0) * (pageSize || 10);

    // Build where conditions
    const searchConditions = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    // Map category to trainer roles
    const getRolesByCategory = (category: string): Role[] => {
      switch (category) {
        case "FITNESS":
          return [Role.FITNESS_TRAINER, Role.FITNESS_TRAINER_ADMIN];
        case "PSYCHOLOGY":
          return [Role.PSYCHOLOGY_TRAINER];
        case "MANIFESTATION":
          return [Role.MANIFESTATION_TRAINER];
        default:
          return [Role.FITNESS_TRAINER, Role.FITNESS_TRAINER_ADMIN, Role.PSYCHOLOGY_TRAINER, Role.MANIFESTATION_TRAINER];
      }
    };

    const roleConditions = {
      role: { in: getRolesByCategory(category || "ALL") }
    };

    // Get total count
    const total = await prisma.users_profile.count({
      where: {
        ...searchConditions,
        ...roleConditions,
      },
    });

    // Get trainers
    const trainers = await prisma.users_profile.findMany({
      where: {
        ...searchConditions,
        ...roleConditions,
      },
      include: {
        trainerClientsAsTrainer: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize || 10,
    });

    // Define the trainer type with includes
    type TrainerWithIncludes = Prisma.users_profileGetPayload<{
      include: {
        trainerClientsAsTrainer: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    }>;

    // Transform the data
    const transformedTrainers = (trainers as TrainerWithIncludes[]).map(trainer => {
      // Map role to category
      const getTrainerCategory = (role: string) => {
        switch (role) {
          case "FITNESS_TRAINER":
          case "FITNESS_TRAINER_ADMIN":
            return "FITNESS";
          case "PSYCHOLOGY_TRAINER":
            return "PSYCHOLOGY";
          case "MANIFESTATION_TRAINER":
            return "MANIFESTATION";
          default:
            return "UNKNOWN";
        }
      };

      // Get client assignments grouped by category
      const clientAssignments = trainer.trainerClientsAsTrainer.map(assignment => ({
        id: assignment.id,
        category: assignment.category,
        clientId: assignment.client.id,
        clientName: assignment.client.name,
      }));

      return {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role,
        // phoneNumber: trainer.phone_number,
        createdAt: trainer.created_at,
        category: getTrainerCategory(trainer.role),
        clientCount: clientAssignments.length,
        clientAssignments,
      };
    });

    console.log('Found trainers:', transformedTrainers.length);

    return {
      data: {
        trainers: transformedTrainers,
        total,
        page: page || 0,
        pageSize: pageSize || 10,
        totalPages: Math.ceil(total / (pageSize || 10)),
      },
    };
  }
);

export type GetAdminTrainersInput = z.infer<typeof GetAdminTrainersSchema>;
