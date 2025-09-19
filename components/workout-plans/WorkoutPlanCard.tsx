import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientWorkoutPlan } from "@/actions/client-workout/get-all-workout-plans-for-client";
import { format } from "date-fns";

interface WorkoutPlanCardProps {
  plan: ClientWorkoutPlan;
}

export function WorkoutPlanCard({ plan }: WorkoutPlanCardProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"; // Green
      case "upcoming":
        return "secondary"; // Blue
      case "previous":
        return "outline"; // Gray
      default:
        return "outline";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "previous":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge 
                variant={getStatusBadgeVariant(plan.computedStatus)}
                className={`${getStatusBadgeColor(plan.computedStatus)} rounded-full`}
              >
                {plan.computedStatus.charAt(0).toUpperCase() + plan.computedStatus.slice(1)}
              </Badge>
              <h3 className="text-lg font-semibold text-card-foreground">
                {plan.title}
              </h3>
            </div>
            
            {plan.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {plan.description}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Trainer: {plan.trainer.name}</span>
              <span className="hidden sm:inline">•</span>
              <span>Duration: {plan.duration_in_weeks} weeks</span>
              <span className="hidden sm:inline">•</span>
              <span>{formatDateRange(plan.start_date, plan.end_date)}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex justify-end gap-2">
          <Link href={`/workout-plan/${plan.id}`}>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700 border-red-600"
            >
              View Plan
            </Button>
          </Link>
          <Link href={`/workout-plan/${plan.id}/progress`}>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700 border-red-600"
            >
              View Progress
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}