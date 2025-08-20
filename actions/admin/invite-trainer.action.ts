"use server"

import { z } from "zod";
import { createSafeAction } from "@/lib/create-safe-action";
import { getAuthenticatedUserId } from "@/utils/user";
import { createServiceClient } from "@/utils/supabase/service";

const InviteTrainerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["FITNESS_TRAINER", "FITNESS_TRAINER_ADMIN", "PSYCHOLOGY_TRAINER", "MANIFESTATION_TRAINER"]),
});

export const inviteTrainer = createSafeAction(
  InviteTrainerSchema,
  async (input) => {
    const adminId = await getAuthenticatedUserId();
    if (!adminId) return { error: "Unauthorized" };

    const { email, name, role } = input;

    try {
      // Debug: Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
      
      console.log('Environment check:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceKey,
        serviceKeyLength: serviceKey?.length || 0,
      });

      // Use service client with admin privileges
      const supabase = createServiceClient();

      console.log('Attempting to invite trainer:', { email, name, role });

      // Send invitation with role metadata
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          name: name,
          role: role,
          invited_by: adminId,
          invited_at: new Date().toISOString(),
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?type=invite&role=${role}`,
      });

      if (error) {
        console.error('Supabase invite error details:', {
          message: error.message,
          status: error.status,
          code: error.code,
          // __isAuthError: error.__isAuthError,
        });
        
        // Provide more helpful error messages
        if (error.code === 'not_admin') {
          return { 
            error: "Admin privileges required. Please check your SUPABASE_SERVICE_ROLE_KEY environment variable." 
          };
        }
        
        return { error: error.message };
      }

      console.log('Trainer invitation sent successfully:', { 
        email, 
        name, 
        role, 
        userId: data?.user?.id 
      });

      return {
        data: {
          success: true,
          message: `Invitation sent to ${email}`,
          userId: data?.user?.id,
        },
      };
    } catch (error) {
      console.error('Failed to invite trainer:', error);
      return { 
        error: error instanceof Error ? error.message : "Failed to send invitation" 
      };
    }
  }
);

export type InviteTrainerInput = z.infer<typeof InviteTrainerSchema>;
