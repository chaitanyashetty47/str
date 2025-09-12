import { CreatePlanMain } from "@/components/create-plan/create-plan-main";
import { PlanEditorProvider } from "@/contexts/PlanEditorContext";
import prisma from "@/utils/prisma/prismaClient";
import { WeightUnit } from "@prisma/client";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Workout Plan - Strentor",
  description: "Create personalized workout plans for your clients. Design comprehensive training programs with exercises, sets, and progressions.",
  keywords: ["create workout plan", "workout design", "training program", "fitness plan", "personal training", "trainer tools"],
};

interface CreatePlanPageProps {
  searchParams: Promise<{ clientId?: string }>;
}

export default async function CreatePlanPage({ searchParams }: CreatePlanPageProps) {
  // Validate user authentication and FITNESS_TRAINER/FITNESS_TRAINER_ADMIN role
  const { user } = await validateServerRole(['FITNESS_TRAINER', 'FITNESS_TRAINER_ADMIN']);

  // Extract clientId from URL parameters
  const params = await searchParams;
  const selectedClientId = params.clientId;

  // Fetch trainer's weight unit
  const trainer = await prisma.users_profile.findUnique({
    where: { id: user.id },
    select: { weight_unit: true },
  });

  const trainerWeightUnit = trainer?.weight_unit || WeightUnit.KG;

  return (
    <PlanEditorProvider 
      trainerWeightUnit={trainerWeightUnit}
      selectedClientId={selectedClientId}
    >
      <CreatePlanMain mode="create" trainerId={user.id} />
    </PlanEditorProvider>
  );
}