'use server';

import { z } from "zod";
import { ActionState, createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";

// ────────────────────────────────────────────────────────────────────────────
// Input validation schema
// ────────────────────────────────────────────────────────────────────────────
const getWorkoutVideosInput = z.object({
  planId: z.string().uuid("Invalid plan ID").optional(),
  workoutDayId: z.string().uuid("Invalid workout day ID").optional(),
});

export type GetWorkoutVideosInput = z.infer<typeof getWorkoutVideosInput>;

export interface WorkoutVideoData {
  id: string;
  workoutDayId: string;
  clientId: string;
  videoUrl: string;
  videoTitle: string | null;
  uploadedAt: Date;
  reviewedAt: Date | null;
  trainerNotes: string | null;
  workoutDay: {
    id: string;
    title: string;
    dayDate: Date;
    weekNumber: number;
    dayNumber: number;
  };
  client: {
    id: string;
    name: string;
    email: string;
  };
}

export type GetWorkoutVideosOutput = {
  videos: WorkoutVideoData[];
  totalCount: number;
};

// ────────────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────────────
async function getWorkoutVideosHandler({ 
  planId, 
  workoutDayId 
}: GetWorkoutVideosInput): Promise<ActionState<GetWorkoutVideosInput, GetWorkoutVideosOutput>> {
  try {
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { error: "Authentication required" };
    }

    // Get user's role to determine access level
    const user = await prisma.users_profile.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Build where clause based on input and user role
    const whereClause: any = {};

    if (workoutDayId) {
      // Get videos for a specific workout day
      whereClause.workout_day_id = workoutDayId;
      
      // Add role-based access control
      if (user.role === 'CLIENT') {
        whereClause.client_id = userId;
      } else if (user.role === 'FITNESS_TRAINER' || user.role === 'FITNESS_TRAINER_ADMIN') {
        // For trainers, verify they have a relationship with the client for this workout day
        // First, get the workout day and its plan
        const workoutDay = await prisma.workout_days.findUnique({
          where: { id: workoutDayId },
          include: {
            workout_plans: {
              select: { client_id: true }
            }
          }
        });

        if (!workoutDay) {
          return { error: "Workout day not found" };
        }

        // Check if the trainer has a relationship with this client
        const trainerClientRelationship = await prisma.trainer_clients.findFirst({
          where: {
            trainer_id: userId,
            client_id: workoutDay.workout_plans.client_id,
            category: 'FITNESS'
          }
        });

        if (!trainerClientRelationship) {
          return { error: "You don't have access to this client's workout videos" };
        }

        // If relationship exists, get videos for this specific day
        whereClause.workout_day_id = workoutDayId;
      } else {
        return { error: "Insufficient permissions to view workout videos" };
      }
    } else if (planId) {
      // Get videos for a specific plan
      if (user.role === 'CLIENT') {
        // Clients can only see their own videos
        whereClause.client_id = userId;
        whereClause.workout_days = {
          plan_id: planId
        };
      } else if (user.role === 'FITNESS_TRAINER' || user.role === 'FITNESS_TRAINER_ADMIN') {
        // Trainers can see videos from their clients for this plan
        // First, get the client_id from the workout plan
        const workoutPlan = await prisma.workout_plans.findUnique({
          where: { id: planId },
          select: { client_id: true }
        });

        if (!workoutPlan) {
          return { error: "Workout plan not found" };
        }

        // Check if the trainer has a relationship with this client
        const trainerClientRelationship = await prisma.trainer_clients.findFirst({
          where: {
            trainer_id: userId,
            client_id: workoutPlan.client_id,
            category: 'FITNESS' // Assuming fitness category for workout videos
          }
        });

        if (!trainerClientRelationship) {
          return { error: "You don't have access to this client's workout videos" };
        }

        // If relationship exists, get videos for this client and plan
        whereClause.client_id = workoutPlan.client_id;
        whereClause.workout_days = {
          plan_id: planId
        };
      } else {
        return { error: "Insufficient permissions to view workout videos" };
      }
    } else {
      // No specific plan/day - get all videos based on role
      if (user.role === 'CLIENT') {
        whereClause.client_id = userId;
      } else if (user.role === 'FITNESS_TRAINER' || user.role === 'FITNESS_TRAINER_ADMIN') {
        // Get all clients for this trainer
        const trainerClients = await prisma.trainer_clients.findMany({
          where: {
            trainer_id: userId,
            category: 'FITNESS'
          },
          select: { client_id: true }
        });

        const clientIds = trainerClients.map(tc => tc.client_id);
        
        if (clientIds.length === 0) {
          return { 
            data: { 
              videos: [],
              totalCount: 0
            } 
          };
        }

        whereClause.client_id = {
          in: clientIds
        };
      } else {
        return { error: "Insufficient permissions to view workout videos" };
      }
    }

    // Fetch videos with related data
    const videos = await prisma.workout_day_videos.findMany({
      where: whereClause,
      include: {
        workout_days: {
          select: {
            id: true,
            title: true,
            day_date: true,
            week_number: true,
            day_number: true,
          }
        },
        users_profile: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: [
        { workout_days: { week_number: 'desc' } },
        { workout_days: { day_number: 'desc' } },
        { uploaded_at: 'desc' }
      ]
    });

    // Transform data to match output interface
    const transformedVideos: WorkoutVideoData[] = videos.map(video => ({
      id: video.id,
      workoutDayId: video.workout_day_id,
      clientId: video.client_id,
      videoUrl: video.video_url,
      videoTitle: video.video_title,
      uploadedAt: video.uploaded_at,
      reviewedAt: video.reviewed_at,
      trainerNotes: video.trainer_notes,
      workoutDay: {
        id: video.workout_days.id,
        title: video.workout_days.title,
        dayDate: video.workout_days.day_date,
        weekNumber: video.workout_days.week_number,
        dayNumber: video.workout_days.day_number,
      },
      client: {
        id: video.users_profile.id,
        name: video.users_profile.name,
        email: video.users_profile.email,
      }
    }));

    return { 
      data: { 
        videos: transformedVideos,
        totalCount: transformedVideos.length
      } 
    };

  } catch (error: any) {
    console.error("Get workout videos error:", error);
    return { error: "Failed to fetch workout videos. Please try again." };
  }
}

export const getWorkoutVideos = createSafeAction<GetWorkoutVideosInput, GetWorkoutVideosOutput>(
  getWorkoutVideosInput,
  getWorkoutVideosHandler,
);