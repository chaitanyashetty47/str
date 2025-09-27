// import { redirect } from "next/navigation";
// import { getWorkoutPlans, getTrainerClients } from "../../../actions/workoutplan.action";
// import { DumbbellIcon } from "lucide-react";
// import { CreatePlanButton } from "../../../components/create-plan/create-plan-button";
// import WorkoutPlanCard from "../../../components/workout-plan/workout-plan";
// import { PlansFilter } from "../../../components/workout-plan/plans-filter";

import { redirect } from "next/navigation";
// import { Tabs } from "@/components/ui/tabs";
import PlansTabs from "@/components/workout-plan/plans-tabs";
import PageHeaderTemplate from "@/components/page-header-template";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workout Plans - Strentor",
  description: "Design personalized training plans for your clients. Create, manage, and track workout plans to transform your clients' fitness journey.",
  keywords: ["workout plans", "training plans", "fitness programs", "personal training", "workout design", "trainer tools"],
};


export default async function PlansPage() {
  // Validate user authentication and FITNESS_TRAINER/FITNESS_TRAINER_ADMIN role
  const { user } = await validateServerRole(['FITNESS_TRAINER', 'FITNESS_TRAINER_ADMIN']);
 
  return (
    <div className="flex-1 w-full flex flex-col gap-8 px-4 md:px-8 py-8 bg-background">
      <PageHeaderTemplate title="Workout Plans" description="Design personalized training plans for your clients to transform their fitness journey" />
      <PlansTabs />
    </div>
  );
}
