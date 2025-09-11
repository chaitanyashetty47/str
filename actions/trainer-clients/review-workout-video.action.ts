'use server';

import { z } from "zod";
import { ActionState, createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { requireTrainerAccess } from "@/utils/user";

// ────────────────────────────────────────────────────────────────────────────
// Input validation schema
// ────────────────────────────────────────────────────────────────────────────
const reviewWorkoutVideoInput = z.object({
  videoId: z.string().uuid("Invalid video ID"),
  trainerNotes: z.string().optional(),
  markAsReviewed: z.boolean(),
});

export type ReviewWorkoutVideoInput = z.infer<typeof reviewWorkoutVideoInput>;
export type ReviewWorkoutVideoOutput = { 
  success: boolean; 
  message: string;
};

// ────────────────────────────────────────────────────────────────────────────
// Handler
// ────────────────────────────────────────────────────────────────────────────
async function reviewWorkoutVideoHandler({ 
  videoId, 
  trainerNotes, 
  markAsReviewed = true 
}: ReviewWorkoutVideoInput): Promise<ActionState<ReviewWorkoutVideoInput, ReviewWorkoutVideoOutput>> {
  try {
    // Check if authenticated user is a trainer
    const { userId: trainerId } = await requireTrainerAccess();
    if (!trainerId) {
      return { error: "Trainer access required" };
    }

    // Verify the video exists and belongs to a client of this trainer
    const video = await prisma.workout_day_videos.findUnique({
      where: { id: videoId },
      include: {
        workout_days: {
          include: {
            workout_plans: {
              select: { trainer_id: true }
            }
          }
        }
      }
    });

    if (!video) {
      return { error: "Workout video not found" };
    }

    // Check if the authenticated trainer is the trainer for this workout plan
    if (video.workout_days.workout_plans.trainer_id !== trainerId) {
      return { error: "You can only review videos from your own clients" };
    }

    // Update the video with trainer review
    const updateData: any = {};
    
    if (markAsReviewed) {
      updateData.reviewed_at = new Date();
    }
    
    if (trainerNotes !== undefined) {
      updateData.trainer_notes = trainerNotes || null;
    }

    await prisma.workout_day_videos.update({
      where: { id: videoId },
      data: updateData
    });

    const action = markAsReviewed ? "reviewed" : "updated";
    return { 
      data: { 
        success: true, 
        message: `Workout video ${action} successfully`
      } 
    };

  } catch (error: any) {
    console.error("Review workout video error:", error);
    return { error: "Failed to review workout video. Please try again." };
  }
}

export const reviewWorkoutVideo = createSafeAction<ReviewWorkoutVideoInput, ReviewWorkoutVideoOutput>(
  reviewWorkoutVideoInput,
  reviewWorkoutVideoHandler,
);