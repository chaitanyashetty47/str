"use server";

import { z } from "zod";
import { SubscriptionStatus } from "@prisma/client";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import { getTrainerClients, getTrainerClientsCount } from "@/actions/trainer-clients/get-trainer-clients";
import { TrainerClientsResponse } from "@/types/trainer-clients.types";
import { createClient } from "@/utils/supabase/server";

// Zod schema for input validation
const trainerClientsQuerySchema = z.object({
  page: z.number().min(0),
  pageSize: z.number().min(1).max(100),
  search: z.string().optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  sort: z.array(z.object({
    id: z.string(),
    desc: z.boolean()
  })).optional(),
});

type TrainerClientsInput = z.infer<typeof trainerClientsQuerySchema>;

export const fetchTrainerClients = createSafeAction(
  trainerClientsQuerySchema,
  async (validatedData: TrainerClientsInput): Promise<ActionState<TrainerClientsInput, TrainerClientsResponse>> => {
    try {
      // Get current user from Supabase auth
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          error: "Authentication required. Please sign in.",
        };
      }

      // Apply defaults for pagination if not supplied
      const page = validatedData.page ?? 0;
      const pageSize = validatedData.pageSize ?? 10;

      // Fetch trainer clients data
      const [rows, total] = await Promise.all([
        getTrainerClients(user.id, { ...validatedData, page, pageSize }),
        getTrainerClientsCount(user.id, {
          search: validatedData.search,
          status: validatedData.status,
        }),
      ]);

      const pageCount = Math.ceil(total / pageSize);

      return {
        data: {
          rows,
          total,
          pageCount,
        },
      };
    } catch (error) {
      console.error("Error fetching trainer clients:", error);
      return {
        error: "Failed to fetch clients. Please try again.",
      };
    }
  }
); 