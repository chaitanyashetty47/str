import { getTrainerClients } from "@/actions/workoutplan.action";
import { redirect } from "next/navigation";
import { CreatePlanDialog } from "./create-plan-dialog";

interface CreatePlanButtonProps {
  label?: string;
}

export async function CreatePlanButton({ label }: CreatePlanButtonProps = {}) {
  const { data: trainerClients, error } = await getTrainerClients();

  if (error === "Unauthorized") {
    return redirect("/sign-in?error=Session%20expired");
  }

  return <CreatePlanDialog trainerClients={trainerClients || []} label={label} />;
} 