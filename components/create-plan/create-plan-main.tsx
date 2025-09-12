"use client"

import { useState } from "react";
import { PlanHeader } from "./plan-header";
import { WeekAndDaySelector } from "./week-and-day-selector";
import { DayCanvas } from "./day-canvas";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Calendar } from "lucide-react";

interface CreatePlanMainProps {
  mode: "create" | "edit" | "archive";
  trainerId?: string;
  planId?: string;
}

export function CreatePlanMain({ mode, trainerId, planId }: CreatePlanMainProps) {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PlanHeader mode={mode} trainerId={trainerId} planId={planId} />

      {/* Mobile Toolbar - Show only on mobile */}
      <div className="md:hidden border-b bg-background px-4 py-3">
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Weeks & Days
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Workout Plan Structure</SheetTitle>
            </SheetHeader>
            <div className="h-full overflow-hidden">
              <WeekAndDaySelector 
                isMobile={true} 
                onDaySelect={() => setIsMobileSheetOpen(false)} 
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Grid - Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 h-[calc(100vh-7rem)] md:h-[calc(100vh-4rem)]">
        {/* Sidebar - Hidden on mobile, shown on tablet+, sticky only on desktop */}
        <div className="hidden md:block md:w-[260px] lg:w-[320px] md:static lg:sticky lg:top-0 lg:h-[calc(100vh-4rem)] border-r bg-gray-50">
          <WeekAndDaySelector />
        </div>
        
        {/* Main Canvas - Responsive with proper overflow */}
        <div className="min-w-0 overflow-y-auto">
          <DayCanvas />
        </div>
      </div>
    </div>
  );
}
