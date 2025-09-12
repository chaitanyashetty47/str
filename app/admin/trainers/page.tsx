import { AdminTrainersPage } from "@/components/admin/trainers/admin-trainers-page";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trainer Management - Admin - Strentor",
  description: "Manage fitness trainers, psychology trainers, and manifestation trainers. Monitor trainer performance, client assignments, and platform activity.",
  keywords: ["trainer management", "fitness trainer admin", "trainer analytics", "trainer performance", "admin tools", "platform administration"],
};

export default async function TrainersPage() {
  // Validate user authentication and ADMIN/FITNESS_TRAINER_ADMIN role
  const { user } = await validateServerRole(['ADMIN', 'FITNESS_TRAINER_ADMIN']);
  
  return <AdminTrainersPage />;
}
