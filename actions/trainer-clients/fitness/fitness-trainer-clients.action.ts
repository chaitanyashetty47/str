"use server";

import { z } from "zod";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import { getTrainerClients, getTrainerClientsCount } from "@/actions/trainer-clients/fitness/get-fitness-trainer-clients";
import { TrainerClientsResponse } from "@/types/trainer-clients.types";
import { createClient } from "@/utils/supabase/server";

// Zod schema for input validation
const trainerClientsQuerySchema = z.object({
  page: z.number().min(0),
  pageSize: z.number().min(1).max(100),
  search: z.string().optional(),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
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

      // Debug logging for date range
      console.log('Backend received dateRange:', validatedData.dateRange);
      console.log('Date range types:', {
        from: validatedData.dateRange?.from,
        fromType: typeof validatedData.dateRange?.from,
        to: validatedData.dateRange?.to,
        toType: typeof validatedData.dateRange?.to,
      });

      // Fetch trainer clients data
      // Note: We now only show ACTIVE, CREATED, and AUTHENTICATED subscriptions
      // Date range filtering is handled in the backend
      const [rows, total] = await Promise.all([
        getTrainerClients(user.id, { 
          ...validatedData, 
          page, 
          pageSize,
          dateRange: validatedData.dateRange ? {
            from: validatedData.dateRange.from,
            to: validatedData.dateRange.to,
          } : undefined
        }),
        getTrainerClientsCount(user.id, {
          search: validatedData.search,
          dateRange: validatedData.dateRange ? {
            from: validatedData.dateRange.from,
            to: validatedData.dateRange.to,
          } : undefined,
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