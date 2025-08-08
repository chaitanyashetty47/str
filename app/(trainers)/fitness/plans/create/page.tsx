import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CreatePlanMain } from "@/components/create-plan/create-plan-main";
import { PlanEditorProvider } from "@/contexts/PlanEditorContext";
import prisma from "@/utils/prisma/prismaClient";
import { WeightUnit } from "@prisma/client";

export default async function CreatePlanPage() {

   // Get current user
   const supabase = await createClient();
   const { data: { user }, error: authError } = await supabase.auth.getUser();
 
   if (authError || !user) {
     redirect("/sign-in");
   }

   // Fetch trainer's weight unit
   const trainer = await prisma.users_profile.findUnique({
     where: { id: user.id },
     select: { weight_unit: true },
   });

   const trainerWeightUnit = trainer?.weight_unit || WeightUnit.KG;

  return (
    <PlanEditorProvider trainerWeightUnit={trainerWeightUnit}>
      <CreatePlanMain mode="create" trainerId={user.id} />
    </PlanEditorProvider>
  );
}