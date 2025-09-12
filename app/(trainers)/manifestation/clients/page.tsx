import { ManifestationTrainerClientsPage } from "@/components/trainer/clients/manifestation";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manifestation Clients - Strentor",
  description: "Manage your manifestation clients, track goal progress, and provide personalized manifestation coaching. Comprehensive client management for manifestation trainers.",
  keywords: ["manifestation clients", "goal setting clients", "manifestation coaching", "client management", "goal tracking", "manifestation trainer"],
};

export default async function ManifestationClientsPage() {
  // Validate user authentication and MANIFESTATION_TRAINER role
  const { user } = await validateServerRole(['MANIFESTATION_TRAINER']);
  
  return <ManifestationTrainerClientsPage />;
}

