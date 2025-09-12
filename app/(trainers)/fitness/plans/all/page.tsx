import { WorkoutPlansPage } from "@/components/workout-plans/workout-plans-page";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Workout Plans - Strentor",
  description: "View and manage all your workout plans. Browse, filter, and organize your training programs for different clients.",
  keywords: ["all workout plans", "workout plan management", "training programs", "fitness plans", "plan organization", "trainer tools"],
};

export default async function AllPlansPage() {
  // Validate user authentication and FITNESS_TRAINER/FITNESS_TRAINER_ADMIN role
  const { user } = await validateServerRole(['FITNESS_TRAINER', 'FITNESS_TRAINER_ADMIN']);
  
  return <WorkoutPlansPage />;
}