import { PsychologyTrainerClientsPage } from "@/components/trainer/clients/psychology";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Psychology Clients - Strentor",
  description: "Manage your psychology clients, track mental health progress, and provide personalized psychological support. Comprehensive client management for psychology trainers.",
  keywords: ["psychology clients", "mental health clients", "psychological support", "client management", "mental health tracking", "psychology trainer"],
};

export default async function PsychologyClientsPage() {
  // Validate user authentication and PSYCHOLOGY_TRAINER role
  const { user } = await validateServerRole(['PSYCHOLOGY_TRAINER']);
  
  return <PsychologyTrainerClientsPage />;
}

