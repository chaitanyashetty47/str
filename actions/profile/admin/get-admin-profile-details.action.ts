"use server";

import prisma from "@/utils/prisma/prismaClient";
import { getAdminUser } from "@/utils/user";

export async function getAdminProfileDetails() {
  try {
    // Check if user is an admin
    const adminUser = await getAdminUser();
    
    if (!adminUser) {
      throw new Error("Admin access required");
    }

    const profileDetails = await prisma.users_profile.findUnique({
      where: {
        id: adminUser.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!profileDetails) {
      throw new Error("Admin profile not found");
    }

    return profileDetails;
  } catch (error) {
    console.error("Error fetching admin profile details:", error);
    throw new Error("Failed to fetch admin profile details");
  }
}