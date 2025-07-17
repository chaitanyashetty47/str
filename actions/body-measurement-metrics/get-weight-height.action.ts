"use server"
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";

export async function getWeightHeight() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  const weightHeight = await prisma.users_profile.findUnique({
    where: {
      id: userId,
    },
    select: {
      weight: true,
      height: true,
    }
  })

  if (!weightHeight) {
    return { error: "User not found" };
  }


  return { weight: weightHeight.weight || 0, height: weightHeight.height || 0 };
}
