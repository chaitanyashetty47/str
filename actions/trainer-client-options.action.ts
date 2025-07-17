"use server";

import { z } from "zod";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import { getTrainerClientOptions } from "@/actions/trainer-clients/get-trainer-client-options";
import { createClient } from "@/utils/supabase/server";

// The action doesn't expect any input values, but createSafeAction
// requires a schema. An empty object schema serves that purpose gracefully.
const schema = z.object({}).optional();

type Input = z.infer<typeof schema>;

export interface TrainerClientOption {
  id: string;
  name: string;
}

export const fetchTrainerClientOptions = createSafeAction(
  schema,
  async (_validatedData: Input): Promise<ActionState<Input, TrainerClientOption[]>> => {
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
      const options = await getTrainerClientOptions(user.id);
      return { data: options };
    } catch (err) {
      console.error("Error fetching trainer client options", err);
      return { error: "Failed to load clients. Please try again later." };
    }
  },
); 