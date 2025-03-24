"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface TrainingBreadcrumbProps {
  planName?: string;
  planId?: string;
  exerciseName?: string;
  dayId?: string;
  dayNumber?: number;
}

export function TrainingBreadcrumb({ 
  planName, 
  planId, 
  exerciseName, 
  dayId, 
  dayNumber 
}: TrainingBreadcrumbProps) {
  const pathname = usePathname();
  
  // Build the breadcrumb items based on current path and provided props
  const breadcrumbItems = useMemo(() => {
    // Get route segments
    const segments = pathname.split('/').filter(Boolean);
    const items = [];
    
    // Add base training route
    items.push({
      label: "Training",
      href: "/training",
      isCurrent: segments.length === 1 && segments[0] === "training"
    });
    
    // Add section route (clients, plans, progress, reports)
    if (segments.length > 1) {
      const section = segments[1];
      const sectionLabel = getSectionLabel(section);
      
      items.push({
        label: sectionLabel,
        href: `/training/${section}`,
        isCurrent: segments.length === 2
      });
    }
    
    // If we have plan information
    if (planName && planId && segments.includes("plans")) {
      // Add plan link
      items.push({
        label: planName,
        href: `/training/plans/${planId}`,
        isCurrent: segments.length === 3 && segments[2] === planId
      });
      
      // If we have day information
      if (dayNumber !== undefined && dayId) {
        items.push({
          label: `Day ${dayNumber}`,
          href: `/training/plans/${planId}/days/${dayId}`,
          isCurrent: segments.includes("days") && !segments.includes("exercises")
        });
        
        // If we have exercise information
        if (exerciseName && segments.includes("exercises")) {
          items.push({
            label: exerciseName,
            href: pathname,
            isCurrent: true
          });
        }
      }
    }
    
    return items;
  }, [pathname, planName, planId, exerciseName, dayId, dayNumber]);

  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-3 flex-wrap">
      {breadcrumbItems.map((item, index) => (
        <div key={item.href} className="flex items-center my-1">
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 mx-1.5" />}
          <Link 
            href={item.href} 
            className={`${
              item.isCurrent 
                ? "text-foreground font-medium" 
                : "hover:text-foreground transition-colors"
            }`}
          >
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}

// Helper function to get section labels
function getSectionLabel(section: string): string {
  const sectionLabels: Record<string, string> = {
    "clients": "My Clients",
    "plans": "Workout Plans",
    "progress": "Client Progress",
    "reports": "Reports & Feedback"
  };
  
  return sectionLabels[section] || section.charAt(0).toUpperCase() + section.slice(1);
} 