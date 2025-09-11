"use server";

import { z } from "zod";
import prisma from "@/utils/prisma/prismaClient";
import { getTrainerUser } from "@/utils/user";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import { revalidatePath } from "next/cache";

// Schema for trainer profile update (only name and email)
const UpdateTrainerProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type UpdateTrainerProfileInput = z.infer<typeof UpdateTrainerProfileSchema>;

async function updateTrainerProfileHandler(
  data: UpdateTrainerProfileInput,
): Promise<ActionState<UpdateTrainerProfileInput, { success: boolean; profile: any }>> {
  try {
    // Check if user is a fitness trainer
    const trainerUser = await getTrainerUser();
    
    if (!trainerUser) {
      return {
        error: "Fitness trainer access required",
      };
    }

    // Update trainer profile data
    const updatedProfile = await prisma.users_profile.update({
      where: { id: trainerUser.userId },
      data: {
        name: data.name,
        email: data.email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    revalidatePath("/fitness/settings");

    return {
      data: {
        success: true,
        profile: updatedProfile,
      },
    };
  } catch (error) {
    console.error("Error updating trainer profile:", error);
    return {
      error: "Failed to update trainer profile",
    };
  }
}

export const updateTrainerProfile = createSafeAction(UpdateTrainerProfileSchema, updateTrainerProfileHandler); 