import { PlansPage } from "@/components/plans/plans-page";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workout Plans - Strentor",
  description: "Browse and manage your personalized workout plans. Access your current training programs, view progress, and discover new fitness routines.",
  keywords: ["workout plans", "training programs", "fitness routines", "exercise plans", "personalized workouts"],
};

export default async function Plans() {
  // Validate user authentication and CLIENT role
  const { user } = await validateServerRole(['CLIENT']);
  
  return <PlansPage />;
}