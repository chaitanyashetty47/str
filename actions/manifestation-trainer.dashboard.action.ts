"use server";

import { createClient } from "@/utils/supabase/server";
import prisma from "@/utils/prisma/prismaClient";
import { unstable_cache } from 'next/cache';

// Types for manifestation trainer dashboard
export interface ManifestationTrainerStats {
  totalClients: number;
}

export interface ManifestationClient {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  assignedAt: string; // ISO date string
  category: string | null; // SubscriptionCategory from trainer_clients
  daysSinceAssignment: number; // Calculated field for urgency
}

export interface ManifestationTrainerDashboardData {
  stats: ManifestationTrainerStats;
  recentClients: ManifestationClient[];
}

// Helper function for stats
async function fetchManifestationTrainerStats(
  trainerId: string
): Promise<ManifestationTrainerStats> {
  const totalClients = await prisma.trainer_clients.count({ 
    where: { 
      trainer_id: trainerId,
      category: "MANIFESTATION" // Only count manifestation clients
    } 
  });

  return { totalClients };
}

// Helper function for recent clients
async function fetchRecentManifestationClients(
  trainerId: string
): Promise<ManifestationClient[]> {
  const currentDate = new Date();
  
  // Get recent manifestation clients (last 5)
  const recentClients = await prisma.trainer_clients.findMany({
    where: {
      trainer_id: trainerId,
      category: "MANIFESTATION" // Only manifestation clients
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      assigned_at: 'desc'
    },
    take: 5 // Only get the 5 most recent clients
  });

  // Process and format the data
  return recentClients.map(client => ({
    id: client.id,
    clientId: client.client_id,
    clientName: client.client.name,
    clientEmail: client.client.email,
    assignedAt: client.assigned_at.toISOString(),
    category: client.category,
    daysSinceAssignment: Math.floor(
      (currentDate.getTime() - client.assigned_at.getTime()) / (1000 * 60 * 60 * 24)
    )
  }));
}

// Cached function for fetching dashboard data
const getCachedManifestationTrainerDashboardData = unstable_cache(
  async (trainerId: string): Promise<ManifestationTrainerDashboardData> => {
    try {
      const [stats, recentClients] = await Promise.all([
        fetchManifestationTrainerStats(trainerId),
        fetchRecentManifestationClients(trainerId),
      ]);

      return {
        stats,
        recentClients,
      };
    } catch (error) {
      console.error("Error fetching manifestation trainer dashboard data:", error);
      throw new Error("Failed to load dashboard data. Please try again later.");
    }
  },
  ['manifestation-trainer-dashboard-data'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['manifestation-trainer-dashboard']
  }
);

// Main export function that handles authentication and uses the cached function
export async function getManifestationTrainerDashboardData(): Promise<ManifestationTrainerDashboardData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  return getCachedManifestationTrainerDashboardData(user.id);
}