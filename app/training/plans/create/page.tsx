import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CreatePlanMain } from "@/components/create-plan/create-plan-main";
import { PlanEditorProvider } from "@/contexts/PlanEditorContext";

export default async function CreatePlanPage() {

   // Get current user
   const supabase = await createClient();
   const { data: { user }, error: authError } = await supabase.auth.getUser();
 
   if (authError || !user) {
     redirect("/sign-in");
   }

  return (
    <PlanEditorProvider>
      <CreatePlanMain mode="create" trainerId={user.id} />
    </PlanEditorProvider>
  );
}