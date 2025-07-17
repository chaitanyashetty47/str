"use server";

import { z } from "zod";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import { revalidatePath } from "next/cache";

// Schema for profile details update
const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  date_of_birth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  weight: z.number().positive("Weight must be positive").optional(),
  weight_unit: z.enum(["KG", "LB"]).optional(),
  height: z.number().positive("Height must be positive").optional(),
  height_unit: z.enum(["CM", "INCHES", "FEET"]).optional(),
  neck: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hips: z.number().positive().optional(),
  activity_level: z.enum(["SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE", "VERY_ACTIVE", "EXTRA_ACTIVE"]).optional(),
  photo_privacy: z.enum(["PRIVATE", "PUBLIC"]).optional(),
});

type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export async function getProfileDetails() {
  try {
    const userId = await getAuthenticatedUserId();
    
    const profileDetails = await prisma.users_profile.findUnique({
      where: {
        id: userId!,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        weight: true,
        weight_unit: true,
        height: true,
        height_unit: true,
        date_of_birth: true,
        gender: true,
        activity_level: true,
        profile_completed: true,
        neck: true,
        waist: true,
        hips: true,
        transformation_photos: {
          select: {
            privacy_setting: true,
          },
          take: 1,
        },
      },
    });

    if (!profileDetails) {
      throw new Error("Profile not found");
    }

    return {
      ...profileDetails,
      photo_privacy: profileDetails.transformation_photos[0]?.privacy_setting || "PRIVATE",
    };
  } catch (error) {
    console.error("Error fetching profile details:", error);
    throw new Error("Failed to fetch profile details");
  }
}

async function updateProfileHandler(
  data: UpdateProfileInput,
): Promise<ActionState<UpdateProfileInput, { success: boolean; profile: any }>> {
  try {
    const userId = await getAuthenticatedUserId();

    const { photo_privacy, ...profileData } = data;

    // Update profile data
    const updatedProfile = await prisma.users_profile.update({
      where: { id: userId! },
      data: {
        ...profileData,
        date_of_birth: profileData.date_of_birth ? new Date(profileData.date_of_birth) : undefined,
        profile_completed: true,
      },
    });

    // Update photo privacy if provided
    if (photo_privacy) {
      await prisma.transformation_photos.updateMany({
        where: { user_id: userId! },
        data: { privacy_setting: photo_privacy },
      });
    }

    revalidatePath("/settings");
    revalidatePath("/profile");

    return {
      data: {
        success: true,
        profile: updatedProfile,
      },
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      error: "Failed to update profile",
    };
  }
}

export const updateProfile = createSafeAction(UpdateProfileSchema, updateProfileHandler);