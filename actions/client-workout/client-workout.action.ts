"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { createClient } from "@/utils/supabase/server";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
interface ProgressMetrics {
  currentWeek: number;
  totalWeeks: number;
  daysRemaining: number;
  progressPercentage: number;
}

// Shape expected by the dashboard page
export interface ClientWorkoutPlanOutput {
  id: string;
  title: string;
  category: string;
  description: string;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  progress: ProgressMetrics;
}

export interface WorkoutDayOutput {
  id: string;
  dayNumber: number;
  title: string;
}

export interface PersonalRecordOutput {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number | null;
  oneRepMax: number | null;
  date: string; // formatted
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function calculateProgress(start: Date, end: Date, totalWeeks: number): ProgressMetrics {
  const now = new Date();

  // Clamp dates to avoid negative numbers
  const totalDurationMs = Math.max(end.getTime() - start.getTime(), 1);
  const elapsedMs = Math.max(now.getTime() - start.getTime(), 0);

  const progressPercentage = Math.min(
    100,
    Math.round((elapsedMs / totalDurationMs) * 100),
  );

  const daysRemaining = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const currentWeek = Math.min(
    totalWeeks,
    Math.max(1, Math.ceil(elapsedMs / (7 * 24 * 60 * 60 * 1000))),
  );

  return {
    currentWeek,
    totalWeeks,
    daysRemaining,
    progressPercentage,
  };
}

async function getAuthenticatedUserId(): Promise<string | null> {
  // We still rely on Supabase for authentication cookies/session.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. getClientCurrentWorkoutPlan
// ────────────────────────────────────────────────────────────────────────────
const currentPlanInput = z.object({});

async function currentPlanHandler(_: z.infer<typeof currentPlanInput>) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  const today = new Date();

  // Find the ONE active plan where today is between start & end dates.
  const plan = await prisma.workout_plans.findFirst({
    where: {
      client_id: userId,
      start_date: { lte: today },
      end_date: { gte: today },
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      duration_in_weeks: true,
      start_date: true,
      end_date: true,
    },
  });

  if (!plan) {
    return { error: "No active workout plan found" };
  }

  const progress = calculateProgress(
    plan.start_date,
    plan.end_date,
    plan.duration_in_weeks,
  );

  const output: ClientWorkoutPlanOutput = {
    id: plan.id,
    title: plan.title,
    category: plan.category,
    description: plan.description ?? "No description available",
    startDate: plan.start_date.toISOString(),
    endDate: plan.end_date.toISOString(),
    durationWeeks: plan.duration_in_weeks,
    progress,
  };

  return { data: output };
}

export const getClientCurrentWorkoutPlan = createSafeAction<
  z.infer<typeof currentPlanInput>,
  ClientWorkoutPlanOutput
>(currentPlanInput, currentPlanHandler);

// ────────────────────────────────────────────────────────────────────────────
// 2. getUpcomingWorkouts
// ────────────────────────────────────────────────────────────────────────────
const upcomingInput = z.object({
  planId: z.string().uuid(),
});

async function upcomingHandler({ planId }: z.infer<typeof upcomingInput>) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  const currentDate = new Date();
  console.log("currentDate", currentDate);

  // Ensure the user owns this plan (cheap guard)
  const ownsPlan = await prisma.workout_plans.findFirst({
    where: {
      id: planId,
      client_id: userId,
      status: "PUBLISHED",
      start_date: { lte: currentDate },
      end_date: { gte: currentDate },
    },
    select: { 
      id: true,
      start_date: true,
      end_date: true,
      duration_in_weeks: true,
    },
  });

  console.log("ownsPlan", ownsPlan);

  if (!ownsPlan) {
    return { error: "Plan not found" };
  }

  const progress = calculateProgress(
    ownsPlan.start_date,
    ownsPlan.end_date,
    ownsPlan.duration_in_weeks,
  );

  const days = await prisma.workout_days.findMany({
    where: { 
      plan_id: planId,
      week_number: progress.currentWeek,
      is_deleted: false // Filter out soft-deleted days
     },
    orderBy: [
      { week_number: "asc" },
      { day_number: "asc" },
    ],
    select: {
      id: true,
      day_number: true,
      title: true,
    },
  });

  const output: WorkoutDayOutput[] = days.map((d) => ({
    id: d.id,
    dayNumber: d.day_number,
    title: d.title,
    // workoutType: getBodyPartDisplayName(d.workout_type ?? ""),
  }));

  return { data: output };
}

export const getUpcomingWorkouts = createSafeAction<
  z.infer<typeof upcomingInput>,
  WorkoutDayOutput[]
>(upcomingInput, upcomingHandler);

// ────────────────────────────────────────────────────────────────────────────
// 3. getUserLastFivePRs
// ────────────────────────────────────────────────────────────────────────────
const prsInput = z.object({});

async function prsHandler(_: z.infer<typeof prsInput>) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  const prs = await prisma.client_max_lifts.findMany({
    where: { client_id: userId },
    orderBy: { date_achieved: "desc" },
    take: 5,
    include: {
      workout_exercise_lists: {
        select: {
          name: true,
        },
      },
    },
  });

  const formatted: PersonalRecordOutput[] = prs.map((pr) => {
    const exerciseName = pr.workout_exercise_lists?.name ?? "Unknown Exercise";
    const dateStr = pr.date_achieved.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return {
      id: pr.id,
      exerciseName,
      weight: pr.max_weight,
      reps: null, // reps not stored in new schema
      oneRepMax: pr.max_weight, // 1RM approximated as max weight lifted
      date: dateStr,
    };
  });

  return { data: formatted };
}

export const getUserLastFivePRs = createSafeAction<
  z.infer<typeof prsInput>,
  PersonalRecordOutput[]
>(prsInput, prsHandler);



