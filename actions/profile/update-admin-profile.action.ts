"use server";

import { z } from "zod";
import prisma from "@/utils/prisma/prismaClient";
import { getAdminUser } from "@/utils/user";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import { revalidatePath } from "next/cache";

// Schema for admin profile update (only name and email)
const UpdateAdminProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type UpdateAdminProfileInput = z.infer<typeof UpdateAdminProfileSchema>;

async function updateAdminProfileHandler(
  data: UpdateAdminProfileInput,
): Promise<ActionState<UpdateAdminProfileInput, { success: boolean; profile: any }>> {
  try {
    // Check if user is an admin
    const adminUser = await getAdminUser();
    
    if (!adminUser) {
      return {
        error: "Admin access required",
      };
    }

    // Update admin profile data
    const updatedProfile = await prisma.users_profile.update({
      where: { id: adminUser.userId },
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

    revalidatePath("/admin/settings");

    return {
      data: {
        success: true,
        profile: updatedProfile,
      },
    };
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return {
      error: "Failed to update admin profile",
    };
  }
}

export const updateAdminProfile = createSafeAction(UpdateAdminProfileSchema, updateAdminProfileHandler);