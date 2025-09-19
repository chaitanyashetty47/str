"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BarChart3, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import WeeklyAnalytics from "./WeeklyAnalytics";
import OverallAnalytics from "./OverallAnalytics";

interface WeekColumnSelectionProps {
  totalWeeks: number;
  planId: string;
  onWeekChange?: (weekNumber: number) => void;
}

export default function WeekColumnSelection({
  totalWeeks,
  planId,
  onWeekChange,
}: WeekColumnSelectionProps) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(1);
  const [viewMode, setViewMode] = useState<'weekly' | 'overall'>('weekly');

  const weeks = Array.from({ length: totalWeeks }, (_, index) => index + 1);

  const handleWeekSelect = (weekNumber: number) => {
    setSelectedWeek(weekNumber);
    setViewMode('weekly');
    onWeekChange?.(weekNumber);
  };

  const handleOverallToggle = () => {
    setViewMode(viewMode === 'overall' ? 'weekly' : 'overall');
    if (viewMode === 'weekly') {
      setSelectedWeek(null);
    } else {
      setSelectedWeek(1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Week Selection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Workout Analytics</CardTitle>
            <Button
              variant={viewMode === 'overall' ? 'outline' : 'default'}
              size="sm"
              onClick={handleOverallToggle}
              className={cn(
                "flex items-center gap-2",
                viewMode === 'weekly' 
                  ? "bg-strentor-red hover:bg-strentor-red/80 text-white" 
                  : "bg-white text-strentor-red hover:bg-strentor-red/10 border-strentor-red"
              )}
            >
              {viewMode === 'overall' ? (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Switch To Weekly Summary
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Switch To Overall Progress
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'weekly' && (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Select a week to view detailed exercise analytics and PR achievements
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {weeks.map((week) => (
                  <Button 
                    key={week}
                    variant={selectedWeek === week ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleWeekSelect(week)}
                    className={cn(
                      "transition-all hover:scale-105",
                      selectedWeek === week && "bg-strentor-red hover:bg-strentor-red/90"
                    )}
                  >
                    Week {week}
                  </Button>
                ))}
              </div>
              {selectedWeek && (
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-strentor-red/10 text-strentor-red">
                    Viewing Week {selectedWeek}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Navigate between exercises using the controls below
                  </p>
                </div>
              )}
            </>
          )}
          
          {viewMode === 'overall' && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                View progress trends and overall performance across all weeks
              </p>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 mt-2">
                Overall Progress View
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Display */}
      {viewMode === 'weekly' && selectedWeek && (
        <WeeklyAnalytics planId={planId} weekNumber={selectedWeek} />
      )}
      
      {viewMode === 'overall' && (
        <OverallAnalytics planId={planId} />
      )}
    </div>
  );
}