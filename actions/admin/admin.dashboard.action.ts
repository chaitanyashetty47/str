"use server";

import { createClient } from "@/utils/supabase/server";
import prisma from "@/utils/prisma/prismaClient";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { startOfMonth, endOfMonth } from "date-fns";
import { z } from "zod";
import { randomUUID } from "crypto";

// Types for the admin dashboard data
const AdminStatsSchema = z.object({
  totalUsers: z.number(),
  usersChange: z.number(),
  subscribedClients: z.number(),
  subscribedClientsChange: z.number(),
  totalRevenue: z.number(),
  revenueGrowthPercentage: z.number(),
});

const TrainerAssignmentSchema = z.object({
  id: z.string(),
  trainerName: z.string(),
  trainerRole: z.string(),
  category: z.string(),
});

const RecentSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  subscriptionPrice: z.number(),
  planName: z.string(),
  planCategory: z.string(),
  trainerAssignments: z.array(TrainerAssignmentSchema),
  isAllInOne: z.boolean(),
  createdAt: z.date(),
});

const TrainerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
});

const AllInOneTrainerAssignmentSchema = z.object({
  fitnessTrainerId: z.string().optional(),
  psychologyTrainerId: z.string().optional(),
  manifestationTrainerId: z.string().optional(),
});

// Type for user signups chart data
const UserSignupDataSchema = z.object({
  month: z.string(),
  signups: z.number(),
  monthNumber: z.number(),
});

export type UserSignupData = z.infer<typeof UserSignupDataSchema>;

const AdminDashboardDataSchema = z.object({
  stats: AdminStatsSchema,
  recentSubscriptions: z.array(RecentSubscriptionSchema),
  userSignupsData: z.array(UserSignupDataSchema),
});

export type AdminStats = z.infer<typeof AdminStatsSchema>;
export type RecentSubscription = z.infer<typeof RecentSubscriptionSchema>;
export type Trainer = z.infer<typeof TrainerSchema>;
export type TrainerAssignment = z.infer<typeof TrainerAssignmentSchema>;
export type AllInOneTrainerAssignment = z.infer<typeof AllInOneTrainerAssignmentSchema>;
export type AdminDashboardData = z.infer<typeof AdminDashboardDataSchema>;

// IST timezone helper functions
const IST_TIMEZONE = "Asia/Kolkata";

function getIstNow(): Date {
  return toZonedTime(new Date(), IST_TIMEZONE);
}

function getIstMonthRange(referenceDate: Date, offsetMonths: number = 0) {
  const istDate = toZonedTime(referenceDate, IST_TIMEZONE);
  const targetDate = new Date(istDate);
  targetDate.setMonth(targetDate.getMonth() + offsetMonths);
  
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  
  // Convert IST boundaries to UTC for database queries
  const utcStart = fromZonedTime(monthStart, IST_TIMEZONE);
  const utcEnd = fromZonedTime(monthEnd, IST_TIMEZONE);
  
  return { startUtc: utcStart, endUtc: utcEnd };
}

// Helper function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to get trainer role based on plan category
function getTrainerRoleForCategory(planCategory: string): ('FITNESS_TRAINER' | 'PSYCHOLOGY_TRAINER' | 'MANIFESTATION_TRAINER')[] {
  switch (planCategory) {
    case 'FITNESS':
      return ['FITNESS_TRAINER'];
    case 'PSYCHOLOGY':
      return ['PSYCHOLOGY_TRAINER'];
    case 'MANIFESTATION':
      return ['MANIFESTATION_TRAINER'];
    case 'ALL_IN_ONE':
      return ['FITNESS_TRAINER', 'PSYCHOLOGY_TRAINER', 'MANIFESTATION_TRAINER'];
    default:
      return ['FITNESS_TRAINER', 'PSYCHOLOGY_TRAINER', 'MANIFESTATION_TRAINER'];
  }
}

// Role-based access control
async function checkAdminAccess(): Promise<{ userId: string; role: string }> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Authentication required");
  }

  // Get user profile to check role
  const userProfile = await prisma.users_profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (!userProfile) {
    throw new Error("User profile not found");
  }

  // Check if user has admin access
  if (userProfile.role !== 'ADMIN' && userProfile.role !== 'FITNESS_TRAINER_ADMIN') {
    throw new Error("Admin access required");
  }

  return { userId: user.id, role: userProfile.role };
}

// Get available trainers for a specific plan category
export async function getAvailableTrainers(planCategory: string): Promise<Trainer[]> {
  await checkAdminAccess();

  const trainerRoles = getTrainerRoleForCategory(planCategory);

  const trainers = await prisma.users_profile.findMany({
    where: {
      role: { in: trainerRoles },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return trainers;
}

// Assign trainer to client for a specific category
export async function assignTrainerToClient(
  clientId: string, 
  trainerId: string, 
  category?: 'FITNESS' | 'PSYCHOLOGY' | 'MANIFESTATION'
): Promise<{ success: boolean; message: string }> {
  try {
    await checkAdminAccess();

    // Check if assignment already exists for this category
    const existingAssignment = await prisma.trainer_clients.findFirst({
      where: {
        client_id: clientId,
        trainer_id: trainerId,
        category: category || null,
      },
    });

    if (existingAssignment) {
      return { success: false, message: "Trainer is already assigned to this client for this category" };
    }

    // Create new assignment
    await prisma.trainer_clients.create({
      data: {
        id: randomUUID(),
        client_id: clientId,
        trainer_id: trainerId,
        category: category || null,
        assigned_at: new Date(),
      },
    });

    return { success: true, message: "Trainer assigned successfully" };
  } catch (error) {
    console.error("Error assigning trainer:", error);
    return { success: false, message: "Failed to assign trainer" };
  }
}

// Assign all trainers for ALL_IN_ONE plan with rollback on failure
export async function assignAllInOneTrainers(
  clientId: string, 
  assignments: AllInOneTrainerAssignment
): Promise<{ success: boolean; message: string }> {
  try {
    await checkAdminAccess();

    // Validate that all required trainers are provided
    if (!assignments.fitnessTrainerId || !assignments.psychologyTrainerId || !assignments.manifestationTrainerId) {
      return { success: false, message: "All three trainers must be assigned for ALL_IN_ONE plan" };
    }

    // Use transaction to ensure all assignments succeed or none do
    const result = await prisma.$transaction(async (tx) => {
      const createdAssignments: string[] = [];

      // Assign Fitness Trainer
      if (assignments.fitnessTrainerId) {
        const fitnessAssignment = await tx.trainer_clients.create({
          data: {
            id: randomUUID(),
            client_id: clientId,
            trainer_id: assignments.fitnessTrainerId,
            category: 'FITNESS',
            assigned_at: new Date(),
          },
        });
        createdAssignments.push(fitnessAssignment.id);
      }

      // Assign Psychology Trainer
      if (assignments.psychologyTrainerId) {
        const psychologyAssignment = await tx.trainer_clients.create({
          data: {
            id: randomUUID(),
            client_id: clientId,
            trainer_id: assignments.psychologyTrainerId,
            category: 'PSYCHOLOGY',
            assigned_at: new Date(),
          },
        });
        createdAssignments.push(psychologyAssignment.id);
      }

      // Assign Manifestation Trainer
      if (assignments.manifestationTrainerId) {
        const manifestationAssignment = await tx.trainer_clients.create({
          data: {
            id: randomUUID(),
            client_id: clientId,
            trainer_id: assignments.manifestationTrainerId,
            category: 'MANIFESTATION',
            assigned_at: new Date(),
          },
        });
        createdAssignments.push(manifestationAssignment.id);
      }

      return createdAssignments;
    });

    return { success: true, message: "All trainers assigned successfully" };
  } catch (error) {
    console.error("Error assigning ALL_IN_ONE trainers:", error);
    return { success: false, message: "Failed to assign trainers. Please try again." };
  }
}

// Get user signups chart data for the current year
export async function getUserSignupsChartData(): Promise<UserSignupData[]> {
  try {
    await checkAdminAccess();
    
    // Use 2025 as the target year since that's where the data exists
    const targetYear = 2025;
    
    // Get user signups for 2025, grouped by month using a more robust approach
    const monthlySignups = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month_number,
        COUNT(*) as signup_count
      FROM users_profile 
      WHERE EXTRACT(YEAR FROM created_at) = ${targetYear}
      GROUP BY month_number
      ORDER BY month_number
    `;
    
    // Fill in missing months with 0 count
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Convert the raw query result to our expected format
    const signupsMap = new Map();
    (monthlySignups as any[]).forEach((data: any) => {
      signupsMap.set(Number(data.month_number), Number(data.signup_count));
    });
    
    return allMonths.map(monthNum => {
      return {
        month: monthNames[monthNum - 1],
        signups: signupsMap.get(monthNum) || 0,
        monthNumber: monthNum
      };
    });
  } catch (error) {
    console.error("Error fetching user signup data:", error);
    throw new Error(`Failed to fetch user signup data: ${error instanceof Error ? error.message : 'Unknown error' }`);
  }
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  // Check admin access first
  await checkAdminAccess();

  const now = getIstNow();
  const currentMonthRange = getIstMonthRange(now, 0);
  const previousMonthRange = getIstMonthRange(now, -1);

  // Fetch all required data in parallel
  const [
    totalUsers,
    currentMonthNewUsers,
    previousMonthNewUsers,
    currentMonthSubscribedClients,
    previousMonthSubscribedClients,
    recentSubscriptionsData,
    userSignupsData,
  ] = await Promise.all([
    // Total users
    prisma.users_profile.count({
      where: {
        role: { in: ['CLIENT'] },
      },
    }),
    
    // New users in current month
    prisma.users_profile.count({
      where: {
        created_at: {
          gte: currentMonthRange.startUtc,
          lt: currentMonthRange.endUtc,
        },
      },
    }),
    
    // New users in previous month
    prisma.users_profile.count({
      where: {
        created_at: {
          gte: previousMonthRange.startUtc,
          lt: previousMonthRange.endUtc,
        },
      },
    }),
    
    // Subscribed clients in current month (distinct users with active subscriptions)
    prisma.user_subscriptions.findMany({
      where: {
        status: { in: ['ACTIVE', 'AUTHENTICATED'] },
        current_start: { lt: currentMonthRange.endUtc },
        current_end: { gt: currentMonthRange.startUtc },
      },
      select: { user_id: true },
      distinct: ['user_id'],
    }),
    
    // Subscribed clients in previous month
    prisma.user_subscriptions.findMany({
      where: {
        status: { in: ['ACTIVE', 'AUTHENTICATED'] },
        current_start: { lt: previousMonthRange.endUtc },
        current_end: { gt: previousMonthRange.startUtc },
      },
      select: { user_id: true },
      distinct: ['user_id'],
    }),

    // Recent subscriptions (last 5)
    prisma.user_subscriptions.findMany({
      where: {
        status: { in: ['ACTIVE', 'AUTHENTICATED'] },
      },
      take: 5,
      orderBy: [
        { start_date: 'desc' },
        { id: 'desc' }, // Fallback ordering
      ],
      include: {
        users_profile: {
          select: {
            name: true,
            email: true,
          },
        },
        subscription_plans: {
          select: {
            name: true,
            category: true,
            price: true,
          },
        },
      },
    }),
    
    // User signups chart data for current year
    getUserSignupsChartData(),
  ]);

  // For revenue calculation, we need to join with subscription_plans
  const currentMonthRevenueData = await prisma.user_subscriptions.findMany({
    where: {
      status: { in: ['ACTIVE', 'AUTHENTICATED'] },
      current_start: { lt: currentMonthRange.endUtc },
      current_end: { gt: currentMonthRange.startUtc },
    },
    include: {
      subscription_plans: {
        select: { price: true },
      },
    },
  });

  const previousMonthRevenueData = await prisma.user_subscriptions.findMany({
    where: {
      status: { in: ['ACTIVE', 'AUTHENTICATED'] },
      current_start: { lt: previousMonthRange.endUtc },
      current_end: { gt: previousMonthRange.startUtc },
    },
    include: {
      subscription_plans: {
        select: { price: true },
      },
    },
  });

  // Calculate revenue sums
  const currentMonthRevenue = currentMonthRevenueData.reduce((sum, subscription) => {
    const price = subscription.subscription_plans?.price;
    return sum + (price ? Number(price) : 0);
  }, 0);

  const previousMonthRevenue = previousMonthRevenueData.reduce((sum, subscription) => {
    const price = subscription.subscription_plans?.price;
    return sum + (price ? Number(price) : 0);
  }, 0);

  // Calculate changes and percentages
  const usersChange = currentMonthNewUsers - previousMonthNewUsers;
  const subscribedClientsChange = currentMonthSubscribedClients.length - previousMonthSubscribedClients.length;
  
  const revenueGrowthPercentage = previousMonthRevenue > 0 
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
    : 0;

  // Process recent subscriptions to include trainer information
  const recentSubscriptions = await Promise.all(
    recentSubscriptionsData.map(async (subscription) => {
      try {
        // Check if user has trainers assigned (category-specific)
        const trainerAssignments = await prisma.trainer_clients.findMany({
          where: {
            client_id: subscription.user_id,
          },
          include: {
            trainer: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        });

        // Process trainer assignments
        const processedAssignments: TrainerAssignment[] = trainerAssignments.map(assignment => {
          let category: string;
          
          // Handle backward compatibility: if category is null/undefined, infer from trainer role
          if (!assignment.category && assignment.trainer?.role) {
            switch (assignment.trainer.role) {
              case 'FITNESS_TRAINER':
                category = 'FITNESS';
                break;
              case 'PSYCHOLOGY_TRAINER':
                category = 'PSYCHOLOGY';
                break;
              case 'MANIFESTATION_TRAINER':
                category = 'MANIFESTATION';
                break;
              default:
                category = 'UNKNOWN';
            }
          } else {
            category = assignment.category || 'UNKNOWN';
          }
          
          return {
            id: assignment.id,
            trainerName: assignment.trainer?.name || 'Unknown Trainer',
            trainerRole: assignment.trainer?.role || 'UNKNOWN',
            category,
          };
        });

        const isAllInOne = subscription.subscription_plans?.category === 'ALL_IN_ONE';

        return {
          id: subscription.id,
          userId: subscription.user_id,
          customerName: subscription.users_profile?.name || 'Unknown User',
          customerEmail: subscription.users_profile?.email || 'No email',
          subscriptionPrice: Number(subscription.subscription_plans?.price || 0),
          planName: subscription.subscription_plans?.name || 'Unknown Plan',
          planCategory: subscription.subscription_plans?.category || 'UNKNOWN',
          trainerAssignments: processedAssignments,
          isAllInOne,
          createdAt: subscription.start_date || new Date(),
        };
      } catch (error) {
        console.error('Error processing subscription:', subscription.id, error);
        // Return a fallback subscription object
        return {
          id: subscription.id,
          userId: subscription.user_id,
          customerName: subscription.users_profile?.name || 'Unknown User',
          customerEmail: subscription.users_profile?.email || 'No email',
          subscriptionPrice: Number(subscription.subscription_plans?.price || 0),
          planName: subscription.subscription_plans?.name || 'Unknown Plan',
          planCategory: subscription.subscription_plans?.category || 'UNKNOWN',
          trainerAssignments: [],
          isAllInOne: subscription.subscription_plans?.category === 'ALL_IN_ONE',
          createdAt: subscription.start_date || new Date(),
        };
      }
    })
  );

  const stats: AdminStats = {
    totalUsers,
    usersChange,
    subscribedClients: currentMonthSubscribedClients.length,
    subscribedClientsChange,
    totalRevenue: currentMonthRevenue,
    revenueGrowthPercentage: Math.round(revenueGrowthPercentage * 100) / 100, // Round to 2 decimal places
  };

  return { 
    stats,
    recentSubscriptions,
    userSignupsData,
  };
}
