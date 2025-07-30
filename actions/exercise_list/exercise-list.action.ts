"use server";

import { z } from "zod";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import { getExerciseList } from "@/actions/exercise_list/get-exercise-list";
import { createClient } from "@/utils/supabase/server";
import { BodyPart } from "@prisma/client";

// The action doesn't expect any input values, but createSafeAction
// requires a schema. An empty object schema serves that purpose gracefully.
const schema = z.object({}).optional();

type Input = z.infer<typeof schema>;

export interface ExerciseListOption {
  id: string;
  name: string;
  youtube_link: string | null;
  type: BodyPart;
}

export const fetchExerciseList = createSafeAction(
  schema,
  async (_validatedData: Input): Promise<ActionState<Input, ExerciseListOption[]>> => {
     // Retrieve the currently-authenticated trainer.
     const supabase = await createClient();
     const {
       data: { user },
       error,
     } = await supabase.auth.getUser();
 
     if (error || !user) {
       return { error: "Authentication required. Please sign in." };
     }

     try {
      const list = await getExerciseList();
      return { data: list };
     } catch (err) {
      console.error("Error fetching exercise list", err);
      return { error: "Failed to load exercises. Please try again later." };
     }
  }
);


