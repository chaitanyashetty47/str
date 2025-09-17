"use server"
import prisma from "@/utils/prisma/prismaClient";
import { getAuthenticatedUserId } from "@/utils/user";
import { stripTimezone } from "@/utils/date-utils";

export async function getWeightHeight() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  // Get current date and strip timezone to ensure consistency regardless of server location
  const today = new Date();
  const todayDate = stripTimezone(today);

  // First check if there's a weight log for today
  const todayWeightLog = await prisma.weight_logs.findFirst({
    where: {
      user_id: userId,
      date_logged: todayDate,
    },
    select: {
      weight: true,
    }
  });

  // Get user profile data
  const userProfile = await prisma.users_profile.findUnique({
    where: {
      id: userId,
    },
    select: {
      weight: true,
      height: true,
    }
  });

  if (!userProfile) {
    return { error: "User not found" };
  }

  // Use today's weight if logged, otherwise fallback to profile weight
  const weight = todayWeightLog ? todayWeightLog.weight : (userProfile.weight || 0);
  const height = userProfile.height || 0;

  return { weight, height };
}
