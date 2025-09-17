"use server"

import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { checkAdminAccess, getAdminUser } from "@/utils/user";
import { Prisma, SubscriptionStatus } from "@prisma/client";
// import { randomUUID } from "crypto";

const GetAdminClientsSchema = z.object({
  page: z.number().optional().transform((v) => v ?? 0),
  pageSize: z.number().optional().transform((v) => v ?? 10),
  search: z.string().optional().transform((v) => v ?? ""),
  category: z.enum(["ALL", "FITNESS", "PSYCHOLOGY", "MANIFESTATION", "ALL_IN_ONE"]).optional().transform((v) => v ?? "ALL"),
});

export const getAdminClients = createSafeAction(
  GetAdminClientsSchema,
  async (input) => {
    const adminUser = await getAdminUser();
    if (!adminUser) return { error: "Admin access required" };

    const { page, pageSize, search, category } = input;
    const skip = (page || 0) * (pageSize || 10);

    // Build where conditions
    const searchConditions = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    const categoryConditions = category !== "ALL" ? {
      user_subscriptions: {
        some: {
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.AUTHENTICATED] },
          subscription_plans: {
            category: category
          }
        }
      }
    } : {};

    // Get total count
    const total = await prisma.users_profile.count({
      where: {
        role: "CLIENT",
        ...searchConditions,
        ...categoryConditions,
      },
    });

    // Get clients with their active subscriptions and trainer assignments
    const clients = await prisma.users_profile.findMany({
      where: {
        role: "CLIENT",
        ...searchConditions,
        ...categoryConditions,
      },
      include: {
        user_subscriptions: {
          where: {
            status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.AUTHENTICATED] }
          },
          include: {
            subscription_plans: true
          }
        },
        trainerClientsAsClient: {
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    });

    // Define the client type with includes
    type ClientWithIncludes = Prisma.users_profileGetPayload<{
      include: {
        user_subscriptions: {
          include: {
            subscription_plans: true
          }
        },
        trainerClientsAsClient: {
          include: {
            trainer: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
        }
      }
    }>;

    console.log('Found clients:', clients.length);
    console.log('First client trainer assignments:', clients[0]?.trainerClientsAsClient);

    // Transform the data
    const transformedClients = (clients as ClientWithIncludes[]).map(client => {
      const activePlans = client.user_subscriptions.map(sub => ({
        id: sub.id,
        name: sub.subscription_plans.name,
        category: sub.subscription_plans.category,
      }));

      const trainerAssignments = client.trainerClientsAsClient.map(assignment => ({
        id: assignment.id,
        trainerId: assignment.trainer.id,
        trainerName: assignment.trainer.name,
        trainerEmail: assignment.trainer.email,
        trainerRole: assignment.trainer.role,
        category: assignment.category,
      }));

      // Group trainers by category (use category field only)
      const fitnessTrainer = trainerAssignments.find(t => t.category === 'FITNESS');
      const psychologyTrainer = trainerAssignments.find(t => t.category === 'PSYCHOLOGY');
      const manifestationTrainer = trainerAssignments.find(t => t.category === 'MANIFESTATION');

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        createdAt: client.created_at,
        activePlans,
        trainerAssignments: {
          fitness: fitnessTrainer || null,
          psychology: psychologyTrainer || null,
          manifestation: manifestationTrainer || null,
        },
        hasAllInOnePlan: activePlans.some(plan => plan.category === 'ALL_IN_ONE'),
      };
    });

    return {
      data: {
        clients: transformedClients,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / (pageSize || 10)),
      },
    };
  }
);

export type GetAdminClientsInput = z.infer<typeof GetAdminClientsSchema>;

// Server action to get trainers by role
const GetTrainersByRoleSchema = z.object({
  roles: z.array(z.string()),
});

export const getTrainersByRole = createSafeAction(
  GetTrainersByRoleSchema,
  async (input) => {
    const adminUser = await getAdminUser();
    if (!adminUser) return { error: "Admin access required" };

    const { roles } = input;

    const trainers = await prisma.users_profile.findMany({
      where: {
        role: { in: roles as any[] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      data: { trainers },
    };
  }
);

// Server action to assign trainer to client
const AssignTrainerSchema = z.object({
  clientId: z.string(),
  trainerId: z.string(),
  category: z.enum(["FITNESS", "PSYCHOLOGY", "MANIFESTATION"]),
});

export const assignTrainerToClient = createSafeAction(
  AssignTrainerSchema,
  async (input) => {
    const adminUser = await getAdminUser();
    if (!adminUser) return { error: "Admin access required" };

    const { clientId, trainerId, category } = input;

    // Check if assignment already exists for this client and category (any trainer)
    const existingAssignment = await prisma.trainer_clients.findFirst({
      where: {
        client_id: clientId,
        category: category,
      },
    });

    let result;
    
    if (existingAssignment) {
      // Check if it's the same trainer
      if (existingAssignment.trainer_id === trainerId) {
        return { error: "Trainer already assigned to this client for this category" };
      }
      
      // Update existing assignment with new trainer
      result = await prisma.trainer_clients.update({
        where: {
          id: existingAssignment.id,
        },
        data: {
          trainer_id: trainerId,
        },
      });
      console.log('Trainer assignment updated:', result);
    } else {
      // Create new assignment
      result = await prisma.trainer_clients.create({
        data: {
          //: randomUUID(),
          client_id: clientId,
          trainer_id: trainerId,
          category: category,
        },
      });
      console.log('New trainer assignment created:', result);
    }

    return { data: { success: true, assignment: result } };
  }
);

// Server action to update trainer assignments
const UpdateTrainerAssignmentsSchema = z.object({
  clientId: z.string(),
  updates: z.array(z.object({
    category: z.enum(["FITNESS", "PSYCHOLOGY", "MANIFESTATION"]),
    oldTrainerId: z.string().optional(),
    newTrainerId: z.string().optional(),
  })),
});

export const updateTrainerAssignments = createSafeAction(
  UpdateTrainerAssignmentsSchema,
  async (input) => {
    const adminUser = await getAdminUser();
    if (!adminUser) return { error: "Admin access required" };

    const { clientId, updates } = input;

    // Process each update
    for (const update of updates) {
      const { category, oldTrainerId, newTrainerId } = update;

      // Remove old assignment if it exists
      if (oldTrainerId) {
        await prisma.trainer_clients.deleteMany({
          where: {
            client_id: clientId,
            trainer_id: oldTrainerId,
            category: category,
          },
        });
      }

      // Add new assignment if specified
      if (newTrainerId) {
        // Check if assignment already exists
        const existingAssignment = await prisma.trainer_clients.findFirst({
          where: {
            client_id: clientId,
            trainer_id: newTrainerId,
            category: category,
          },
        });

        if (!existingAssignment) {
          await prisma.trainer_clients.create({
            data: {
              // id: randomUUID(),
              client_id: clientId,
              trainer_id: newTrainerId,
              category: category,
            },
          });
        }
      }
    }

    return { data: { success: true } };
  }
);

export type GetTrainersByRoleInput = z.infer<typeof GetTrainersByRoleSchema>;
export type AssignTrainerInput = z.infer<typeof AssignTrainerSchema>;
export type UpdateTrainerAssignmentsInput = z.infer<typeof UpdateTrainerAssignmentsSchema>;