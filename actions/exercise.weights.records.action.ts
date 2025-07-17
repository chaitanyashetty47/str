import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

export const UserExerciseWeightsSchema = z.object({
  exercise_id: z.string(),
  exercise_name: z.string(),
  date_logged: z.string(), // ISO string
  weight_used: z.number().nullable(),
  week_number: z.number(),
});

export type UserExerciseWeight = z.infer<typeof UserExerciseWeightsSchema>;

export async function getUserExerciseWeights() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: "Session expired" };
  }

  // Retrieve all exercise weights records for the user, joining with exercise table
  const { data, error } = await supabase
  .from("user_workout_logs")
  .select(`
    exercise_id,
    date_logged,
    weight_used,
    week_number,
    exercises_workout(
      exercise_id,
      exercise(
        id,
        name
      )
    )
  `)
  .eq("user_id", user.id);

  if (error) {
    return { data: null, error: error.message };
  }

  // Map and validate
  const mapped = (data || []).map((row: any) => ({
      // The real exercise id and name:
    exercise_id: row.exercises_workout?.exercise?.id ?? "",
    exercise_name: row.exercises_workout?.exercise?.name ?? "",
    date_logged: row.date_logged,
    weight_used: row.weight_used,
    week_number: row.week_number,
  }));

  const validated = z.array(UserExerciseWeightsSchema).safeParse(mapped);
  if (!validated.success) {
    return { data: null, error: "Invalid data format" };
  }

  return { data: validated.data, error: null };
}

export async function getClientsProgress() {
  const supabase = await createClient();

 // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

 if (userError || !user) {
   return { data: null, error: "Session expired" };
 }

 //retreive all the exercise weights records for the user and the exercise
 const { data: exerciseWeightsRecords, error: exerciseWeightsRecordsError } = await supabase
   .from("user_workout_logs")
   .select("*")
   .eq("user_id", user.id);
   
   

}
