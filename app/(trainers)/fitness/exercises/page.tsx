import { Metadata } from "next";
import { ExercisesPage } from "@/components/exercises/exercises-page";
import { validateServerRole } from "@/lib/server-role-validation";

export const metadata: Metadata = {
  title: "Exercise Management - Strentor",
  description: "Manage your exercise library for workout plans. Add, edit, and organize exercises to create comprehensive training programs for your clients.",
  keywords: ["exercise management", "exercise library", "workout exercises", "fitness exercises", "exercise database", "trainer tools"],
};

export default async function Page() {
  // Validate user authentication and FITNESS_TRAINER/FITNESS_TRAINER_ADMIN role
  const { user } = await validateServerRole(['FITNESS_TRAINER', 'FITNESS_TRAINER_ADMIN']);
  
  return <ExercisesPage />;
}