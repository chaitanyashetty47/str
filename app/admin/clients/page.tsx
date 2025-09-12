import { AdminClientsPage } from "@/components/admin/clients/admin-clients-page";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Management - Admin - Strentor",
  description: "Manage all platform clients, view subscription status, and monitor client activity. Comprehensive client management tools for administrators.",
  keywords: ["client management", "user management", "subscription management", "client analytics", "admin tools", "platform administration"],
};

export default async function AdminClientsPageRoute() {
  // Validate user authentication and ADMIN/FITNESS_TRAINER_ADMIN role
  const { user } = await validateServerRole(['ADMIN', 'FITNESS_TRAINER_ADMIN']);
  
  return <AdminClientsPage />;
}
