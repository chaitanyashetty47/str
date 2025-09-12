"use server";

import { z } from "zod";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import { createClient } from "@/utils/supabase/server";
import prisma from "@/utils/prisma/prismaClient";
import { cache } from "react";

// -----------------------------------------------------------------------------
// Input validation schema – currently no inputs, but defined for future-proofing
// -----------------------------------------------------------------------------
const InputSchema = z.object({});

// -----------------------------------------------------------------------------
// Output type describing the grouped workout plans returned to the client
// -----------------------------------------------------------------------------
export type PlansGrouped = {
  active: any[];
  drafted: any[];
  previous: any[];
  all: any[];
};

// Cached DB fetch – one result per trainerId per server process
const fetchTrainerPlans = cache((trainerId: string) =>
  prisma.workout_plans.findMany({
    where: { trainer_id: trainerId },
    include: {
      client: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { created_at: "desc" },
  })
);

// -----------------------------------------------------------------------------
// Handler: fetch plans and group them according to the spec
// -----------------------------------------------------------------------------
async function handler(): Promise<ActionState<z.infer<typeof InputSchema>, PlansGrouped>> {
  // 1. Init Supabase and ensure we have an authenticated trainer
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  // 2. Fetch plans via Prisma (better DX & typing)
  try {
    const plans = await fetchTrainerPlans(user.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Helper to normalize client relation to `client`
    const mapClient = (p: typeof plans[number]) => ({
      ...p,
      name: p.title, // alias to match existing card component
      duration_weeks: p.duration_in_weeks,
      days: 3, // fallback if days column removed; adjust if column exists
      client: p.client,
    });

    const drafted = plans.filter((p) => p.status === "DRAFT").map(mapClient);
    const active = plans
      .filter(
        (p) => p.status === "PUBLISHED" && new Date(p.end_date) >= today,
      )
      .map(mapClient);
    const previous = plans
      .filter((p) => new Date(p.end_date) < today || p.status === "ARCHIVED")
      .map(mapClient);

    return {
      data: {
        active,
        drafted,
        previous,
        all: plans.map(mapClient),
      },
    };
  } catch (e: any) {
    return { error: e.message };
  }
}

// -----------------------------------------------------------------------------
// Export the safe server action
// -----------------------------------------------------------------------------
export const getTrainerPlans = createSafeAction(InputSchema, handler);
