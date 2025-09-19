import PageHeaderTemplate from "@/components/page-header-template";
import { WorkoutPlansClient } from "@/components/workout-plans/WorkoutPlansClient";
import { getClientWorkoutPlans } from "@/actions/client-workout/get-all-workout-plans-for-client";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Workout Plans - Strentor",
  description: "View and manage all your workout plans. Track your fitness journey with active, upcoming, and previous workout plans.",
  keywords: ["workout plans", "fitness plans", "training programs", "exercise routines", "fitness tracking"],
};

export default async function AllWorkoutPlans() {
  // Validate user authentication and CLIENT role
  const { user } = await validateServerRole(['CLIENT']);
  
  // Fetch initial workout plans
  const result = await getClientWorkoutPlans({
    status: "all",
    sortBy: "start_date",
    sortOrder: "desc"
  });

  const initialPlans = result.data?.plans || [];

  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8 bg-background">
      <PageHeaderTemplate 
        title="All Workout Plans" 
        description="View and manage all your workout plans" 
      />
      
      <WorkoutPlansClient initialPlans={initialPlans} />
    </div>
  );
}