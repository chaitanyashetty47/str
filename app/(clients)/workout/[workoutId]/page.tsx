import { Suspense } from "react";
import { WorkoutLoggerClient } from "@/components/workout-logger/workout-logger-client";
import { validateServerRole } from "@/lib/server-role-validation";


interface WorkoutLogPageProps {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{  weekNumber: string }>;
}

export default async function WorkoutLogPage({ 
  params, 
  searchParams 
}: WorkoutLogPageProps) {
  const { workoutId } = await params;
  const { weekNumber } = await searchParams;

  const { user } = await validateServerRole(['CLIENT']);

  // Validate required search params
  if (!weekNumber) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Date Range</h1>
        <p className="text-gray-600">
          Please provide both startDate and endDate parameters.
        </p>
      </div>
    );
  }


  return (

    <div className="container mx-auto px-4 py-6">
      <Suspense fallback={<WorkoutLoggerSkeleton />}>
        <WorkoutLoggerClient
          workoutId={workoutId}
        
          weekNumber={parseInt(weekNumber)}
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

      {/* Progress skeleton */}
      <div className="bg-white rounded-lg border p-4">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-2 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Navigation skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Days skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white border rounded-lg p-4 space-y-4">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-2 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 