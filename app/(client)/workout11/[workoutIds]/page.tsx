import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { WorkoutLoggerClient } from "@/components/workout-logger/workout-logger-client";
import { getWeekRange } from "@/actions/client-workout/client-weekly-workout.action";

interface PageProps {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export default async function WorkoutLogPage({ params, searchParams }: PageProps) {
  const { workoutId } = await params;
  const { startDate, endDate } = await searchParams;

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // If no date range provided, default to current week
  let weekStart: string;
  let weekEnd: string;

  if (startDate && endDate) {
    weekStart = startDate;
    weekEnd = endDate;
  } else {
    const { startDate: defaultStart, endDate: defaultEnd } = getWeekRange(new Date());
    weekStart = defaultStart;
    weekEnd = defaultEnd;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<WorkoutLoggerSkeleton />}>
        <WorkoutLoggerClient
          workoutId={workoutId}
          startDate={weekStart}
          endDate={weekEnd}
        />
      </Suspense>
    </div>
  );
}

function WorkoutLoggerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Week navigation skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Days skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 