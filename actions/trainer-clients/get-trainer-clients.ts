import prisma from "@/utils/prisma/prismaClient";
import { TrainerClientsQuery, TrainerClientRow } from "@/types/trainer-clients.types";
import { SubscriptionStatus, SubscriptionCategory } from "@prisma/client";

// Helper to build sort order for Prisma
function buildSortOrder(sort?: TrainerClientsQuery['sort']) {
  if (!sort || sort.length === 0) {
    // Default sort by join date (newest first)
    return { assigned_at: 'desc' as const };
  }

  const sortItem = sort[0];
  switch (sortItem.id) {
    case 'name':
      return {
        users_profile_trainer_clients_client_idTousers_profile: {
          name: sortItem.desc ? 'desc' as const : 'asc' as const
        }
      };
    case 'email':
      return {
        users_profile_trainer_clients_client_idTousers_profile: {
          email: sortItem.desc ? 'desc' as const : 'asc' as const
        }
      };
    case 'joinDate':
      return { assigned_at: sortItem.desc ? 'desc' as const : 'asc' as const };
    default:
      return { assigned_at: 'desc' as const };
  }
}

export async function getTrainerClients(
  trainerId: string,
  query: TrainerClientsQuery
): Promise<TrainerClientRow[]> {
  const { page, pageSize, search, status, sort } = query;

  // Subscription plans categories we want to include
  const ALLOWED_CATEGORIES: SubscriptionCategory[] = [
    SubscriptionCategory.FITNESS,
    SubscriptionCategory.ALL_IN_ONE,
  ];

  const trainerClients = await prisma.trainer_clients.findMany({
    where: {
      trainer_id: trainerId,
      client: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
        // Always restrict to allowed plan categories
        user_subscriptions: {
          some: {
            subscription_plans: {
              category: { in: ALLOWED_CATEGORIES },
            },
            ...(status && { status }),
          },
        },
      },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          user_subscriptions: {
            where: {
              status: {
                in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CREATED]
              },
              subscription_plans: {
                category: { in: ALLOWED_CATEGORIES },
              },
            },
            orderBy: { start_date: "desc" },
            take: 1,
            include: {
              subscription_plans: {
                select: { name: true }
              }
            }
          }
        }
      }
    },
    orderBy: buildSortOrder(sort),
    skip: page * pageSize,
    take: pageSize,
  });

  // Transform the nested Prisma result into flat TrainerClientRow objects
  return trainerClients.map((tc) => {
    const clientProfile = tc.client;
    const latestSubscription = clientProfile.user_subscriptions[0];
    
    return {
      id: clientProfile.id,
      name: clientProfile.name,
      email: clientProfile.email,
      plan: latestSubscription?.subscription_plans.name || null,
      status: latestSubscription?.status || null,
      joinDate: latestSubscription?.start_date?.toISOString() || tc.assigned_at.toISOString(),
    };
  });
}

export async function getTrainerClientsCount(
  trainerId: string,
  query: Omit<TrainerClientsQuery, 'page' | 'pageSize' | 'sort'>
): Promise<number> {
  const { search, status } = query;
  
  const ALLOWED_CATEGORIES: SubscriptionCategory[] = [
    SubscriptionCategory.FITNESS,
    SubscriptionCategory.ALL_IN_ONE,
  ];

  return await prisma.trainer_clients.count({
    where: {
      trainer_id: trainerId,
      client: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
        user_subscriptions: {
          some: {
            subscription_plans: {
              category: { in: ALLOWED_CATEGORIES },
            },
            ...(status && { status }),
          },
        },
      },
    },
  });
} 