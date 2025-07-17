// import { redirect } from "next/navigation";
// import { getWorkoutPlans, getTrainerClients } from "../../../actions/workoutplan.action";
// import { DumbbellIcon } from "lucide-react";
// import { CreatePlanButton } from "../../../components/create-plan/create-plan-button";
// import WorkoutPlanCard from "../../../components/workout-plan/workout-plan";
// import { PlansFilter } from "../../../components/workout-plan/plans-filter";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
// import { Tabs } from "@/components/ui/tabs";
import PlansTabs from "@/components/workout-plan/plans-tabs";
import PageHeaderTemplate from "@/components/page-header-template";

// export default async function PlansPage({
//   searchParams,
// }: {
//   searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
// }) {
//   // Await the searchParams object to fix the dynamic API warning
//   const params = await searchParams;
  
//   // Extract filter parameters from URL
//   const query = typeof params.query === 'string' ? params.query : undefined;
//   const clientId = typeof params.client === 'string' ? params.client : undefined;
//   const status = typeof params.status === 'string' 
//     ? (params.status === 'active' || params.status === 'previous' 
//       ? params.status 
//       : undefined) 
//     : undefined;

//   // Fetch client list for the filter dropdown
//   const { data: trainerClients, error: clientsError } = await getTrainerClients();
  
//   if (clientsError === "Unauthorized") {
//     return redirect("/sign-in?error=Session%20expired");
//   }

//   // Fetch filtered plans
//   const { data: plans, error } = await getWorkoutPlans({
//     searchQuery: query,
//     clientId: clientId,
//     status: status as 'active' | 'previous' | undefined,
//   });

//   if (error === "Unauthorized") {
//     return redirect("/sign-in?error=Session%20expired");
//   }

//   return (
//     <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8 bg-background">
//       {/* Hero section */}
//       <div className="relative mb-2">
//         <div className="max-w-5xl mx-auto">
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
//             <div>
//               <h1 className="text-3xl font-bold">Workout Plans</h1>
//               <p className="text-muted-foreground mt-2">
//                 Design personalized training plans for your clients to <span className="text-red-500 font-medium">transform</span> their fitness journey
//               </p>
//             </div>
//             <CreatePlanButton label="Create New Plan" />
//           </div>
//         </div>
//       </div>

//       {/* Filters */}
//       <div className="max-w-5xl mx-auto w-full">
//         <PlansFilter clients={trainerClients || []} />
//       </div>

//       {/* Plans grid with consistent card component */}
//       {plans?.length === 0 ? (
//         <div className="max-w-5xl mx-auto bg-muted/30 rounded-lg p-12 text-center">
//           <DumbbellIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//           <h3 className="text-xl font-medium mb-2">No workout plans found</h3>
//           <p className="text-muted-foreground mb-6">
//             {query || clientId || status 
//               ? "No plans match your current filters. Try adjusting your search criteria."
//               : "Create your first plan to start transforming your clients' fitness journey"}
//           </p>
//           {!query && !clientId && !status && (
//             <CreatePlanButton label="Create Your First Plan" />
//           )}
//         </div>
//       ) : (
//         <div className="max-w-5xl mx-auto w-full">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
//             {plans?.map((plan) => (
//               <WorkoutPlanCard key={plan.id} plan={plan} />
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


export default async function PlansPage() {
    // Get current user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
  
    if (authError || !user) {
      redirect("/sign-in");
    }
 
  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8 bg-background">
      <PageHeaderTemplate title="Workout Plans" description="Design personalized training plans for your clients to transform their fitness journey" />
      <PlansTabs />
    </div>
  );
}
