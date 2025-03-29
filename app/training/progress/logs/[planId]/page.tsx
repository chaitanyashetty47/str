import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Award, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getClientDetailedProgress } from "@/actions/trainer.action";
import ClientProgressFilter from "./client-progress-filter";

// Get formatted workout type names
const getWorkoutTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    legs: "Legs",
    chest_triceps: "Chest & Triceps",
    back_biceps: "Back & Biceps",
    full_body: "Full Body",
  };
  return typeMap[type] || type;
};

export default async function ClientProgressLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ week?: string; day?: string; }>;
}) {
  // Await the dynamic params
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const planId = resolvedParams.planId;
  const selectedWeek = resolvedSearchParams.week ? parseInt(resolvedSearchParams.week) : null;
  const selectedDay = resolvedSearchParams.day ? parseInt(resolvedSearchParams.day) : null;

  const { data, error } = await getClientDetailedProgress(planId);

  if (error || !data) {
    return notFound();
  }

  // Group logs by week
  const logsByWeek: Record<number, typeof data.logs> = {};
  data.logs.forEach(log => {
    if (!logsByWeek[log.weekNumber]) {
      logsByWeek[log.weekNumber] = [];
    }
    logsByWeek[log.weekNumber].push(log);
  });

  // Extract all available weeks sorted in descending order
  const availableWeeks = Object.keys(logsByWeek)
    .map(Number)
    .sort((a, b) => b - a);

  // Default to the most recent week if none selected
  const currentWeek = selectedWeek || (availableWeeks.length > 0 ? availableWeeks[0] : null);

  // Filter logs by selected week and day
  let filteredLogs = data.logs;
  
  if (currentWeek !== null) {
    filteredLogs = filteredLogs.filter(log => log.weekNumber === currentWeek);
  }
  
  if (selectedDay !== null) {
    filteredLogs = filteredLogs.filter(log => log.dayNumber === selectedDay);
  }

  // Get days available for current week
  const daysInCurrentWeek = currentWeek !== null 
    ? [...new Set(logsByWeek[currentWeek]?.map(log => log.dayNumber))].sort() 
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link
            href="/training/progress"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Client Progress
          </Link>
          <h1 className="text-2xl font-bold">{data.clientName}'s Workout Progress</h1>
          <p className="text-muted-foreground">
            {data.planName} • {data.planCategory} • {data.planDuration} weeks
          </p>
        </div>
        
        <ClientProgressFilter 
          availableWeeks={availableWeeks}
          daysInCurrentWeek={daysInCurrentWeek}
          currentWeek={currentWeek}
          selectedDay={selectedDay}
        />
      </div>

      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <h3 className="text-xl font-medium mb-1">No workout logs found</h3>
            <p className="text-muted-foreground text-center">
              {!currentWeek 
                ? "This client hasn't logged any workouts yet." 
                : `No logs found for week ${currentWeek}${selectedDay ? `, day ${selectedDay}` : ''}. Try selecting a different week or day.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredLogs.map((log) => (
            <Card key={`${log.weekNumber}-${log.dayNumber}`} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <div>
                      <Badge variant="outline" className="mr-2 font-normal">
                        Week {log.weekNumber}
                      </Badge>
                      Day {log.dayNumber}: {getWorkoutTypeName(log.workoutType)}
                    </div>
                  </CardTitle>
                  
                  {log.completedAt && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      Completed on {new Date(log.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <WorkoutLogAccordion exercises={log.exercises} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Extracted to avoid React Server Component runtime errors with event handlers
function WorkoutLogAccordion({ exercises }: { exercises: any[] }) {
  return (
    <div className="space-y-4">
      {exercises.map((exercise) => (
        <div key={exercise.id} className="border rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 font-medium">
            <div className="text-left">{exercise.name}</div>
            <div className="text-sm text-muted-foreground">
              {exercise.sets.length} sets completed
            </div>
          </div>
          
          <div className="px-4 pb-4 border-t pt-4">
            {exercise.notes && (
              <div className="mb-4 text-sm bg-muted/50 p-3 rounded-md">
                <p className="font-medium">Trainer Notes:</p>
                <p>{exercise.notes}</p>
              </div>
            )}
            
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 w-[80px]">Set</th>
                  <th className="text-left py-2">Weight (kg)</th>
                  <th className="text-left py-2">Reps</th>
                  <th className="text-right py-2">PR</th>
                </tr>
              </thead>
              <tbody>
                {exercise.sets.map((set: any) => (
                  <tr key={set.setNumber} className="border-b">
                    <td className="py-2 font-medium">
                      {set.setNumber}
                    </td>
                    <td className="py-2">{set.weight}</td>
                    <td className="py-2">{set.reps}</td>
                    <td className="text-right py-2">
                      {set.isPR && (
                        <Badge className="bg-amber-500 hover:bg-amber-600">
                          <Award className="h-3 w-3 mr-1" />
                          PR
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
