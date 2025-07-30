// New file: API route to fetch exercise list without triggering RSC refresh loops
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getExerciseList } from "@/actions/exercise_list/get-exercise-list";

export async function GET() {
  // Optional auth - only trainers maybe; but include user verification
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const list = await getExerciseList();
    return NextResponse.json(list, { status: 200 });
  } catch (err) {
    console.error("Error fetching exercise list", err);
    return NextResponse.json({ error: "Failed to load exercises" }, { status: 500 });
  }
} 