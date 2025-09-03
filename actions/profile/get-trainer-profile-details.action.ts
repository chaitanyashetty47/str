"use server";

import prisma from "@/utils/prisma/prismaClient";
import { getTrainerUser } from "@/utils/user";

export async function getTrainerProfileDetails() {
  try {
    // Check if user is a fitness trainer
    const trainerUser = await getTrainerUser();
    
    if (!trainerUser) {
      throw new Error("Fitness trainer access required");
    }

    const profileDetails = await prisma.users_profile.findUnique({
      where: {
        id: trainerUser.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!profileDetails) {
      throw new Error("Trainer profile not found");
    }

    return profileDetails;
  } catch (error) {
    console.error("Error fetching trainer profile details:", error);
    throw new Error("Failed to fetch trainer profile details");
  }
} 