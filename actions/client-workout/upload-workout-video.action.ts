'use server';

import { z } from "zod";
import { ActionState, createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";

// ────────────────────────────────────────────────────────────────────────────
// Input validation schema
// ────────────────────────────────────────────────────────────────────────────
const uploadWorkoutVideoInput = z.object({
  workoutDayId: z.string().uuid("Invalid workout day ID"),
  videoUrl: z.string().url("Please provide a valid video URL"),
  videoTitle: z.string().optional(),
});

export type UploadWorkoutVideoInput = z.infer<typeof uploadWorkoutVideoInput>;
export type UploadWorkoutVideoOutput = { 
  success: boolean; 
  message: string;
  videoId?: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────────────
async function uploadWorkoutVideoHandler({ 
  workoutDayId, 
  videoUrl, 
  videoTitle 
}: UploadWorkoutVideoInput): Promise<ActionState<UploadWorkoutVideoInput, UploadWorkoutVideoOutput>> {
  try {
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return { error: "Authentication required" };
    }

    // Verify the workout day exists and belongs to the authenticated user
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

    // Check if the authenticated user is the client for this workout plan
    if (workoutDay.workout_plans.client_id !== userId) {
      return { error: "You can only upload videos for your own workout days" };
    }

    // Check if a video already exists for this workout day
    const existingVideo = await prisma.workout_day_videos.findUnique({
      where: { workout_day_id: workoutDayId }
    });

    if (existingVideo) {
      // Update existing video
      const updatedVideo = await prisma.workout_day_videos.update({
        where: { id: existingVideo.id },
        data: {
          video_url: videoUrl,
          video_title: videoTitle || null,
          uploaded_at: new Date(), // Update upload time
          reviewed_at: null, // Reset review status when video is updated
          trainer_notes: null, // Clear previous trainer notes
        }
      });

      return { 
        data: { 
          success: true, 
          message: "Workout video updated successfully",
          videoId: updatedVideo.id
        } 
      };
    } else {
      // Create new video
      const newVideo = await prisma.workout_day_videos.create({
        data: {
          id: crypto.randomUUID(),
          workout_day_id: workoutDayId,
          client_id: userId,
          video_url: videoUrl,
          video_title: videoTitle || null,
        }
      });

      return { 
        data: { 
          success: true, 
          message: "Workout video uploaded successfully",
          videoId: newVideo.id
        } 
      };
    }

  } catch (error: any) {
    console.error("Upload workout video error:", error);
    return { error: "Failed to upload workout video. Please try again." };
  }
}

export const uploadWorkoutVideo = createSafeAction<UploadWorkoutVideoInput, UploadWorkoutVideoOutput>(
  uploadWorkoutVideoInput,
  uploadWorkoutVideoHandler,
);