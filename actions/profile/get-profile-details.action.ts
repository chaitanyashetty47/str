"use server";

import { z } from "zod";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import { revalidatePath } from "next/cache";
import { alpha3ToCountryEnum } from '@/utils/country-mapping';

// Schema for profile details update
const UpdateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  country: z.string().min(3, "Please select a country").max(3, "Invalid country code").optional(),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  weight: z.number().positive("Weight must be positive").optional(),
  height: z.number().positive("Height must be positive").optional(),
  neck: z.number().min(25, "Neck measurement must be at least 25cm").max(60, "Neck measurement must be less than 60cm").optional(),
  waist: z.number().min(50, "Waist measurement must be at least 50cm").max(150, "Waist measurement must be less than 150cm").optional(),
  hips: z.number().min(70, "Hips measurement must be at least 70cm").max(150, "Hips measurement must be less than 150cm").optional(),
  activity_level: z.enum(["SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE", "VERY_ACTIVE", "EXTRA_ACTIVE"]).optional(),
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
        country: true,
        phone: true,
        role: true,
        weight: true,
        height: true,
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

    // Calculate age from date_of_birth
    const age = profileDetails.date_of_birth 
      ? Math.floor((new Date().getTime() - new Date(profileDetails.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    return {
      ...profileDetails,
      age,
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

    // Convert country Alpha3 to enum if provided
    const countryEnum = data.country ? alpha3ToCountryEnum(data.country) : undefined;
    if (data.country && !countryEnum) {
      return {
        error: "Invalid country selection"
      };
    }

    // Handle phone number (trim and nullify if empty)
    const phoneNumber = data.phone?.trim() || null;

    // Update profile data
    const updatedProfile = await prisma.users_profile.update({
      where: { id: userId! },
      data: {
        ...data,
        country: countryEnum as any, // Convert to enum type
        phone: phoneNumber,
        weight_unit: "KG", // Always KG for profile updates
        height_unit: "CM", // Always CM for profile updates
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
        profile_completed: true,
      },
    });

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