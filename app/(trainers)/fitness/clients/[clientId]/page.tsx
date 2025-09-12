import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { validateServerRole } from "@/lib/server-role-validation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Profile - Strentor",
  description: "View detailed client information, workout history, and progress tracking. Comprehensive client profile management for fitness trainers.",
  keywords: ["client profile", "client details", "workout history", "progress tracking", "fitness trainer", "client management"],
};

interface ClientProfilePageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientProfilePage({ params }: ClientProfilePageProps) {
  // Validate user authentication and FITNESS_TRAINER/FITNESS_TRAINER_ADMIN role
  const { user } = await validateServerRole(['FITNESS_TRAINER', 'FITNESS_TRAINER_ADMIN']);
  
  const { clientId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/training/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Client Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Client profile page for ID: <code className="bg-muted px-2 py-1 rounded">{clientId}</code>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            This page will show detailed client information, workout history, progress tracking, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 