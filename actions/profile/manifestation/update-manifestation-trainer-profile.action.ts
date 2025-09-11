"use server";

import { z } from "zod";
import prisma from "@/utils/prisma/prismaClient";
import { getManifestationTrainerUser } from "@/utils/user";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import { revalidatePath } from "next/cache";

// Schema for manifestation trainer profile update (only name and email)
const UpdateManifestationTrainerProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type UpdateManifestationTrainerProfileInput = z.infer<typeof UpdateManifestationTrainerProfileSchema>;

async function updateManifestationTrainerProfileHandler(
  data: UpdateManifestationTrainerProfileInput,
): Promise<ActionState<UpdateManifestationTrainerProfileInput, { success: boolean; profile: any }>> {
  try {
    // Check if user is a manifestation trainer
    const manifestationTrainerUser = await getManifestationTrainerUser();
    
    if (!manifestationTrainerUser) {
      return {
        error: "Manifestation trainer access required",
      };
    }

    // Update manifestation trainer profile data
    const updatedProfile = await prisma.users_profile.update({
      where: { id: manifestationTrainerUser.userId },
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

    revalidatePath("/manifestation/settings");

    return {
      data: {
        success: true,
        profile: updatedProfile,
      },
    };
  } catch (error) {
    console.error("Error updating manifestation trainer profile:", error);
    return {
      error: "Failed to update manifestation trainer profile",
    };
  }
}

export const updateManifestationTrainerProfile = createSafeAction(UpdateManifestationTrainerProfileSchema, updateManifestationTrainerProfileHandler);