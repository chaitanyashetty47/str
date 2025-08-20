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
        client: {
          name: sortItem.desc ? 'desc' as const : 'asc' as const
        }
      };
    case 'email':
      return {
        client: {
          email: sortItem.desc ? 'desc' as const : 'asc' as const
        }
      };
    case 'joinDate':
      return { assigned_at: sortItem.desc ? 'desc' as const : 'asc' as const };
    default:
      return { assigned_at: 'desc' as const };
  }
}

export async function getManifestationTrainerClients(
  trainerId: string,
  query: TrainerClientsQuery
): Promise<TrainerClientRow[]> {
  const { page, pageSize, search, dateRange, sort } = query;

  // Subscription plans categories we want to include (MANIFESTATION trainer only)
  const ALLOWED_CATEGORIES: SubscriptionCategory[] = [
    SubscriptionCategory.MANIFESTATION,
    SubscriptionCategory.ALL_IN_ONE,
  ];

  // Only show clients with these subscription statuses
  const ALLOWED_STATUSES: SubscriptionStatus[] = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CREATED,
    SubscriptionStatus.AUTHENTICATED,
  ];

  // Build date range filter for subscription start_date
  // Only apply filter when BOTH from and to dates are provided
  const dateFilter = dateRange?.from && dateRange?.to ? {
    start_date: {
      // Use gte for from date (inclusive) and lte for to date (inclusive)
      // Ensure we're comparing dates properly by setting time to start/end of day
      gte: new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate(), 0, 0, 0, 0),
      lte: new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999),
    }
  } : {};

  console.log('Date filter being applied:', dateFilter); // Debug log
  if (dateFilter.start_date) {
    console.log('Filtering subscriptions between:', {
      from: dateFilter.start_date.gte,
      to: dateFilter.start_date.lte,
    });
  }

  // First, get all trainer clients with their subscriptions
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
        // Always restrict to allowed plan categories and statuses
        user_subscriptions: {
          some: {
            subscription_plans: {
              category: { in: ALLOWED_CATEGORIES },
            },
            status: { in: ALLOWED_STATUSES },
            // Apply date range filter to subscription start_date
            ...dateFilter,
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
              subscription_plans: {
                category: { in: ALLOWED_CATEGORIES },
              },
              status: { in: ALLOWED_STATUSES },
              // Apply date range filter here too
              ...dateFilter,
            },
            orderBy: [
              // First prioritize ACTIVE subscriptions
              { status: 'asc' }, // ACTIVE comes first alphabetically
              // Then by start date (most recent first)
              { start_date: 'desc' }
            ],
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

  console.log('Raw trainer clients found:', trainerClients.length); // Debug log

  // Transform the nested Prisma result into flat TrainerClientRow objects
  // Group by client to prevent duplicates and show best subscription
  const clientMap = new Map<string, TrainerClientRow>();

  trainerClients.forEach((tc) => {
    const clientProfile = tc.client;
    const clientId = clientProfile.id;
    
    // If we already have this client, skip (prevent duplicates)
    if (clientMap.has(clientId)) {
      return;
    }

    // Get the best subscription for this client
    const subscriptions = clientProfile.user_subscriptions;
    let bestSubscription = null;

    if (subscriptions.length > 0) {
      // First try to find an ACTIVE subscription
      const activeSubscription = subscriptions.find(sub => sub.status === SubscriptionStatus.ACTIVE);
      if (activeSubscription) {
        bestSubscription = activeSubscription;
      } else {
        // If no active, take the most recent one (already ordered by start_date desc)
        bestSubscription = subscriptions[0];
      }
    }
    
    // Create the client row
    const clientRow: TrainerClientRow = {
      id: clientProfile.id,
      name: clientProfile.name,
      email: clientProfile.email,
      plan: bestSubscription?.subscription_plans.name || null,
      status: bestSubscription?.status || null,
      joinDate: bestSubscription?.start_date?.toISOString() || tc.assigned_at.toISOString(),
    };

    console.log(`Client ${clientProfile.name} join date: ${clientRow.joinDate}`); // Debug log

    clientMap.set(clientId, clientRow);
  });

  // Convert map values to array
  return Array.from(clientMap.values());
}

export async function getManifestationTrainerClientsCount(
  trainerId: string,
  query: Omit<TrainerClientsQuery, 'page' | 'pageSize' | 'sort'>
): Promise<number> {
  const { search, dateRange } = query;
  
  const ALLOWED_CATEGORIES: SubscriptionCategory[] = [
    SubscriptionCategory.MANIFESTATION,
    SubscriptionCategory.ALL_IN_ONE,
  ];

  const ALLOWED_STATUSES: SubscriptionStatus[] = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CREATED,
    SubscriptionStatus.AUTHENTICATED,
  ];

  // Build date range filter for subscription start_date
  // Only apply filter when BOTH from and to dates are provided
  const dateFilter = dateRange?.from && dateRange?.to ? {
    start_date: {
      gte: new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate(), 0, 0, 0, 0),
      lte: new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999),
    }
  } : {};

  // Count unique clients (not subscriptions)
  const result = await prisma.trainer_clients.groupBy({
    by: ['client_id'],
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
            status: { in: ALLOWED_STATUSES },
            // Apply date range filter here too
            ...dateFilter,
          },
        },
      },
    },
  });

  return result.length;
}

