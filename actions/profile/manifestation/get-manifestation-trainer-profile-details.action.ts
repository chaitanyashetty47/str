"use server";

import prisma from "@/utils/prisma/prismaClient";
import { getManifestationTrainerUser } from "@/utils/user";

export async function getManifestationTrainerProfileDetails() {
  try {
    // Check if user is a manifestation trainer
    const manifestationTrainerUser = await getManifestationTrainerUser();
    
    if (!manifestationTrainerUser) {
      throw new Error("Manifestation trainer access required");
    }

    const profileDetails = await prisma.users_profile.findUnique({
      where: {
        id: manifestationTrainerUser.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!profileDetails) {
      throw new Error("Manifestation trainer profile not found");
    }

    return profileDetails;
  } catch (error) {
    console.error("Error fetching manifestation trainer profile details:", error);
    throw new Error("Failed to fetch manifestation trainer profile details");
  }
}