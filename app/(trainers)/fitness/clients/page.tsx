import { fetchTrainerClients } from "@/actions/trainer-clients/fitness/fitness-trainer-clients.action";
import { TrainerClientsPage } from "@/components/trainer/clients/fitness";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Management - Strentor",
  description: "Manage your fitness clients, track their progress, and assign workout plans. Comprehensive client management tools for personal trainers.",
  keywords: ["client management", "fitness clients", "personal training", "client tracking", "workout assignment", "trainer tools"],
};

export default async function ClientsPage() {
  // Validate user authentication and FITNESS_TRAINER/FITNESS_TRAINER_ADMIN role
   const { user } = await validateServerRole(['FITNESS_TRAINER', 'FITNESS_TRAINER_ADMIN']);

  // Fetch initial data for the first page
  const initialDataResult = await fetchTrainerClients({
    page: 0,
    pageSize: 10,
  });

  // Handle the case where the action returns an error
  if (initialDataResult.error) {
    console.error("Error fetching initial trainer clients:", initialDataResult.error);
  }

  return (
    <TrainerClientsPage 
      initialData={initialDataResult.data}
    />
  );
} 