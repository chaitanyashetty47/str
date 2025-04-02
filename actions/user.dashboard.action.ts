"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Fetches the user's last 5 PRs with related exercise information
 * 
 * @returns A list of the user's most recent PRs with their exercise details
 */
export async function getUserLastFivePRs() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "User not authenticated", data: null };
  }

  // Get last 5 PRs for the user
  const { data: prHistory, error: prError } = await supabase
    .from("pr_history")
    .select(`
      id,
      weight,
      reps,
      one_rm,
      date_achieved,
      exercise_id,
      exercises_workout:exercise_id (
        id,
        exercise_id,
        exercise:exercise_id (
          id, 
          name
        )
      )
    `)
    .eq("user_id", user.id)
    .order("date_achieved", { ascending: false })
    .limit(5);

  if (prError) {
    console.error("Error fetching PR history:", prError);
    return { error: prError.message, data: null };
  }

  // Format the PR data for display
  const formattedPRs = prHistory.map(pr => ({
    id: pr.id,
    exerciseName: pr.exercises_workout?.exercise?.name || "Unknown Exercise",
    weight: pr.weight,
    reps: pr.reps,
    oneRepMax: pr.one_rm ? Math.round(Math.abs(pr.one_rm)) : null,
    date: new Date(pr.date_achieved).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }));

  return { data: formattedPRs, error: null };
}
