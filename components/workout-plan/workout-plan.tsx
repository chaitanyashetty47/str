import Link from "next/link";
import { CalendarIcon, LayersIcon, ArrowRightIcon, ClockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const WorkoutPlanCard = ({ plan }: { plan: any }) => {
  // Check if the plan is active or previous using the same logic as the filter
  // Get today's date at midnight for consistent comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Plan is active if the end date is greater than or equal to today at midnight
  const isActive = new Date(plan.end_date) >= today;
  
  // Format dates
  const startDate = plan.start_date ? format(new Date(plan.start_date), "MMM d, yyyy") : "N/A";
  const endDate = plan.end_date ? format(new Date(plan.end_date), "MMM d, yyyy") : "N/A";

  return (
    <Link href={`/training/plans/${plan.id}`}>
      <div className="group hover:shadow-lg transition-all duration-300 bg-white rounded-lg border hover:border-red-200 overflow-hidden flex flex-col h-full">
        <div className="p-6 flex-1">
          {/* Header with status badge */}
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold group-hover:text-red-600 transition-colors line-clamp-1">
              {plan.name}
            </h2>
            <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {isActive ? "Active" : "Previous"}
            </Badge>
          </div>
          
          {/* Client name with consistent styling */}
          <p className="text-sm text-muted-foreground mb-4">
            {plan.client?.name || plan.client?.email || "No client assigned"}
          </p>
          
          {/* Date range */}
          <div className="flex items-center text-sm mb-3">
            <ClockIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{startDate} - {endDate}</span>
          </div>
          
          {/* Metrics with consistent layout and icons */}
          <div className="flex items-center gap-6 mt-2">
            <div className="flex items-center text-sm">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{plan.days} days/week</span>
            </div>
            <div className="flex items-center text-sm">
              <LayersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{plan.duration_weeks} weeks</span>
            </div>
          </div>
        </div>
        
        {/* Consistent footer */}
        <div className="bg-muted/20 p-4 border-t flex items-center justify-end">
          <span className="text-sm font-medium text-red-600 flex items-center">
            View Plan <ArrowRightIcon className="ml-1 h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
};

export default WorkoutPlanCard;