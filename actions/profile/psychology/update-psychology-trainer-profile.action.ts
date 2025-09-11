"use server";

import { z } from "zod";
import prisma from "@/utils/prisma/prismaClient";
import { getPsychologyTrainerUser } from "@/utils/user";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import { revalidatePath } from "next/cache";

// Schema for psychology trainer profile update (only name and email)
const UpdatePsychologyTrainerProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type UpdatePsychologyTrainerProfileInput = z.infer<typeof UpdatePsychologyTrainerProfileSchema>;

async function updatePsychologyTrainerProfileHandler(
  data: UpdatePsychologyTrainerProfileInput,
): Promise<ActionState<UpdatePsychologyTrainerProfileInput, { success: boolean; profile: any }>> {
  try {
    // Check if user is a psychology trainer
    const psychologyTrainerUser = await getPsychologyTrainerUser();
    
    if (!psychologyTrainerUser) {
      return {
        error: "Psychology trainer access required",
      };
    }

    // Update psychology trainer profile data
    const updatedProfile = await prisma.users_profile.update({
      where: { id: psychologyTrainerUser.userId },
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

    revalidatePath("/psychological/settings");

    return {
      data: {
        success: true,
        profile: updatedProfile,
      },
    };
  } catch (error) {
    console.error("Error updating psychology trainer profile:", error);
    return {
      error: "Failed to update psychology trainer profile",
    };
  }
}

export const updatePsychologyTrainerProfile = createSafeAction(UpdatePsychologyTrainerProfileSchema, updatePsychologyTrainerProfileHandler);