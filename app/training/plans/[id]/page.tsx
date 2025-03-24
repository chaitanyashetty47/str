import { redirect } from "next/navigation";
import { getPlanById, getTrainerClients, deletePlanAction } from "@/actions/workoutplan.action";
import { EditPlanForm } from "@/components/edit-plan/edit-plan-form";
import DayTabs from "@/components/edit-plan/day-tabs";
import { TrainingBreadcrumb } from "@/components/training-breadcrumb";
import DeletePlanButton from "@/components/delete-plan-button";

interface EditPlanPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}

// Metadata for the page
export const metadata = {
  title: 'Edit Workout Plan',
  description: 'Edit your workout plan details and exercises',
};

export default async function EditPlanPage({ params, searchParams }: EditPlanPageProps) {
  const { id } = await params;
  const { success, error } = await searchParams;
  
  const [planResponse, clientsResponse] = await Promise.all([
    getPlanById(id),
    getTrainerClients()
  ]);

  if (planResponse.error === "Unauthorized" || clientsResponse.error === "Unauthorized") {
    return redirect("/sign-in?error=Session%20expired");
  }

  if (!planResponse.data) {
    return redirect("/training/plans?error=Plan%20not%20found");
  }

  const plan = planResponse.data;
  const trainerClients = clientsResponse.data || [];

  return (
    <>
      {/* Breadcrumb - positioned at the top */}
      <div className="mb-5 flex justify-between items-center">
        <TrainingBreadcrumb planName={plan.name} planId={plan.id} />
        <DeletePlanButton planId={plan.id} planName={plan.name} />
      </div>
      
      {/* Main content */}
      <div className="w-full">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
            {decodeURIComponent(success)}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {decodeURIComponent(error)}
          </div>
        )}
        
        <EditPlanForm plan={plan} trainerClients={trainerClients} />
        
        <DayTabs planId={plan.id} days={plan.days || 5} />
      </div>
    </>
  );
} 