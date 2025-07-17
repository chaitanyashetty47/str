import { createClient } from "@/utils/supabase/server";
import { fetchTrainerClients } from "@/actions/trainer-clients.action";
import TrainerClientsPage from "@/features/training/pages/trainer-clients";
import { redirect } from "next/navigation";

export default async function ClientsPage() {
  // Get current user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

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