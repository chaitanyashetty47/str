"use server";

import prisma from "@/utils/prisma/prismaClient";
import { getPsychologyTrainerUser } from "@/utils/user";

export async function getPsychologyTrainerProfileDetails() {
  try {
    // Check if user is a psychology trainer
    const psychologyTrainerUser = await getPsychologyTrainerUser();
    
    if (!psychologyTrainerUser) {
      throw new Error("Psychology trainer access required");
    }

    const profileDetails = await prisma.users_profile.findUnique({
      where: {
        id: psychologyTrainerUser.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!profileDetails) {
      throw new Error("Psychology trainer profile not found");
    }

    return profileDetails;
  } catch (error) {
    console.error("Error fetching psychology trainer profile details:", error);
    throw new Error("Failed to fetch psychology trainer profile details");
  }
}