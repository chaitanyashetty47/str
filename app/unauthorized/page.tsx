import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, Shield, User, FileX } from 'lucide-react';

interface UnauthorizedPageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function UnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  const { reason } = await searchParams;

  // Define different error scenarios
  const errorScenarios = {
    trainer_required: {
      icon: Shield,
      title: "Fitness Trainer Access Required",
      description: "You need fitness trainer privileges to access this page. Please contact your administrator if you believe this is an error.",
      homeLink: "/",
      homeLinkText: "Go Home"
    },
    plan_access: {
      icon: FileX,
      title: "Plan Access Denied",
      description: "You don't have permission to edit this workout plan. You can only edit plans that you created.",
      homeLink: "/training/plans",
      homeLinkText: "View Your Plans"
    },
    trainer_profile_missing: {
      icon: User,
      title: "Trainer Profile Missing",
      description: "Your trainer profile could not be found. Please contact support for assistance.",
      homeLink: "/",
      homeLinkText: "Go Home"
    },
    access_denied: {
      icon: AlertCircle,
      title: "Access Denied",
      description: "You don't have permission to access this resource. Please check your credentials and try again.",
      homeLink: "/",
      homeLinkText: "Go Home"
    }
  };

  // Get the appropriate scenario or default
  const scenario = errorScenarios[reason as keyof typeof errorScenarios] || errorScenarios.access_denied;
  const IconComponent = scenario.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <IconComponent className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">{scenario.title}</h1>
          <p className="text-muted-foreground leading-relaxed">
            {scenario.description}
          </p>
        </div>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href={scenario.homeLink}>
              {scenario.homeLinkText}
            </Link>
          </Button>
          
          {reason === "trainer_required" && (
            <Button variant="outline" asChild className="w-full">
              <Link href="/contact">
                Contact Support
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}