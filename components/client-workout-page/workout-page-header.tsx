import { format } from "date-fns";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getWeekRangeSimple } from "@/utils/date-utils";

interface ProgressMetrics {
  currentWeek: number;
  totalWeeks: number;
  daysRemaining: number;
  progressPercentage: number;        // Overall progress (set-based)
  weeklyProgressPercentage: number;  // Current week progress (set-based)
}

interface WorkoutPageHeaderProps {
  planId?: string;    // Add planId for logging link
  title?: string;
  description?: string;
  category?: string;
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
  durationWeeks?: number;
  progress?: ProgressMetrics;
}

export default function WorkoutPageHeader({
  planId,
  title="",
  description="",
  category="",
  startDate,
  endDate,
  durationWeeks=0,
  progress,
}: WorkoutPageHeaderProps) {
  // Helper formatters (safe for undefined)
  const fmtDate = (dateStr?: string) =>
    dateStr ? format(new Date(dateStr), "PPP") : "-";

  const totalDays = startDate && endDate ?
    Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const elapsedDays = progress ? totalDays - progress.daysRemaining : 0;

  // Generate current week date range for logging link
  const getCurrentWeekRange = () => {
    const now = new Date();
    return getWeekRangeSimple(now);
  };

  return (
    <Card className="border rounded-xl">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* ───────────────── Left column ───────────────── */}
          <div className="flex-1 space-y-4">
            {/* Title */}
            <h2 className="text-xl font-semibold leading-tight md:text-2xl">
              {title}
            </h2>

            {/* Description */}
            {description && (
              <p className="text-sm text-muted-foreground max-w-prose">
                {description}
              </p>
            )}

            {/* Meta grid (labels above values) */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Start Date</span>
                <span>{fmtDate(startDate)}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">End Date</span>
                <span>{fmtDate(endDate)}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">Category</span>
                <span>{category || "-"}</span>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground">Duration</span>
                <span>{durationWeeks ? `${durationWeeks} weeks` : "-"}</span>
              </div>
            </div>
          </div>

          {/* ───────────────── Right column ───────────────── */}
          <div className="w-full md:w-80 space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Progress</span>
            <Progress className="text-strentor-orange outline-double outline-black" value={progress?.progressPercentage ?? 0} />
            <span className="text-xs text-muted-foreground">
              {progress
                ? `${progress.progressPercentage}% completed (${elapsedDays}/${totalDays} days)`
                : "No data"}
            </span>

            {/* Weekly Progress */}
            <div className="pt-2 border-t">
              <span className="text-sm font-medium text-muted-foreground">Week {progress?.currentWeek || 1} Progress</span>
              <Progress className="text-strentor-red outline-double outline-black" value={progress?.weeklyProgressPercentage ?? 0} />
              <span className="text-xs text-muted-foreground">
                {progress
                  ? `${progress.weeklyProgressPercentage}% completed this week`
                  : "No data"}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4 mt-3">
              {planId ? (
                <Link href={`/workout/${planId}?weekNumber=${progress?.currentWeek}`}>
                  <Button size="sm" className="w-full bg-strentor-red text-white hover:bg-strentor-red/80 hover:text-white">
                    Start Current Week
                  </Button>
                </Link>
              ) : (
                <Button size="sm" className="w-full bg-strentor-red text-white hover:bg-strentor-red/80 hover:text-white" disabled>
                  Start Current Week
                </Button>
              )}
              {planId && (
                <Link href={`/workout-plan/${planId}/summary`}>
                  <Button size="sm" variant="outline" className="w-full border-strentor-red text-strentor-red hover:bg-strentor-red/80 hover:text-white mt-2">
                    View Analytics & Progress
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}