"use server";

import { createClient } from "@/utils/supabase/server";
import prisma from "@/utils/prisma/prismaClient";
import { unstable_cache } from 'next/cache';

// Types for psychological trainer dashboard
export interface PsychologicalTrainerStats {
  totalClients: number;
}

export interface PsychologicalClient {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  assignedAt: string; // ISO date string
  category: string | null; // SubscriptionCategory from trainer_clients
  daysSinceAssignment: number; // Calculated field for urgency
}

export interface PsychologicalTrainerDashboardData {
  stats: PsychologicalTrainerStats;
  recentClients: PsychologicalClient[];
}

// Helper function for stats
async function fetchPsychologicalTrainerStats(
  trainerId: string
): Promise<PsychologicalTrainerStats> {
  const totalClients = await prisma.trainer_clients.count({ 
    where: { 
      trainer_id: trainerId,
      category: "PSYCHOLOGY" // Only count psychology clients
    } 
  });

  return { totalClients };
}

// Helper function for recent clients
async function fetchRecentPsychologicalClients(
  trainerId: string
): Promise<PsychologicalClient[]> {
  const currentDate = new Date();
  
  // Get recent psychology clients (last 5)
  const recentClients = await prisma.trainer_clients.findMany({
    where: {
      trainer_id: trainerId,
      category: "PSYCHOLOGY" // Only psychology clients
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
const getCachedPsychologicalTrainerDashboardData = unstable_cache(
  async (trainerId: string): Promise<PsychologicalTrainerDashboardData> => {
    try {
      const [stats, recentClients] = await Promise.all([
        fetchPsychologicalTrainerStats(trainerId),
        fetchRecentPsychologicalClients(trainerId),
      ]);

      return {
        stats,
        recentClients,
      };
    } catch (error) {
      console.error("Error fetching psychological trainer dashboard data:", error);
      throw new Error("Failed to load dashboard data. Please try again later.");
    }
  },
  ['psychological-trainer-dashboard-data'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['psychological-trainer-dashboard']
  }
);

// Main export function that handles authentication and uses the cached function
export async function getPsychologicalTrainerDashboardData(): Promise<PsychologicalTrainerDashboardData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  return getCachedPsychologicalTrainerDashboardData(user.id);
}