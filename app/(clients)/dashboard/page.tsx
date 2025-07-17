import Link from "next/link";
import {
  Dumbbell,
  ArrowRight,
  User,
  Weight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import UpcomingWorkouts, {
  UpcomingWorkoutsLoading,
} from "@/components/upcoming-workouts";
import ProgressGraphs from "@/components/progress-graphs";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

import {
  getClientCurrentWorkoutPlan,
  getUserLastFivePRs,
} from "@/actions/client-workout/client-workout.action";
import { Suspense } from "react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch current workout plan
  const {
    data: workoutPlan,
    error: workoutPlanError,
  } = await getClientCurrentWorkoutPlan({});

  if (workoutPlanError || !workoutPlan) {
    return redirect("/home");
  }

  const {
    progressPercentage,
    currentWeek,
    totalWeeks,
    daysRemaining,
  } = workoutPlan.progress;

  // Fetch last five PRs
  const { data: userPRs } = await getUserLastFivePRs({});

  return (
    <div className="container py-8 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome back, {user.user_metadata.name}!
          </h1>
          <p className="text-xl text-muted-foreground mt-1">
            Let&apos;s crush today&apos;s goals! 👊
          </p>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-1">Workout Plan Progress</h2>

          <Progress value={progressPercentage} className="h-2 mb-4" />
          <p className="text-muted-foreground mb-4">
            {daysRemaining} days left in your current plan
          </p>

          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md w-fit">
            <Dumbbell className="h-5 w-5 text-gray-700" />
            <span className="font-medium">
              Currently on Week {currentWeek} of {totalWeeks}
            </span>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/profile">
                <User className="mr-2 h-5 w-5" />
                Update Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Recent PRs Section */}
      <div className="border rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Personal Records</h2>
          <Link
            href="/personal-records"
            className="text-primary font-medium flex items-center hover:underline"
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {userPRs && userPRs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-left font-semibold text-gray-700">
                    Exercise
                  </th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700">
                    Weight
                  </th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700">
                    Reps
                  </th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-700">
                    1RM
                  </th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-700">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {userPRs.map((pr, index) => (
                  <tr
                    key={pr.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-gray-50/50" : ""
                    }`}
                  >
                    <td className="py-4 px-4 font-medium text-gray-900">
                      {pr.exerciseName}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold text-gray-900">
                        {pr.weight}
                      </span>
                      <span className="text-gray-500 ml-1">kg</span>
                    </td>
                    <td className="py-4 px-4 text-center font-medium text-gray-900">
                      {pr.reps ?? "-"}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {pr.oneRepMax ? (
                        <>
                          <span className="font-semibold text-gray-900">
                            {pr.oneRepMax}
                          </span>
                          <span className="text-gray-500 ml-1">kg</span>
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right text-gray-500">{pr.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground bg-gray-50/50 rounded-lg">
            <Weight className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium text-gray-600">
              No personal records found yet.
            </p>
            <p className="text-sm mt-2 text-gray-500">
              Complete workouts to start tracking your progress!
            </p>
          </div>
        )}
      </div>

      {/* Upcoming Workouts */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <Suspense fallback={<UpcomingWorkoutsLoading />}>
          <UpcomingWorkouts
            planId={workoutPlan.id}
            week={workoutPlan.progress.currentWeek}
          />
        </Suspense>
      </div>

      {/* Progress Graphs */}
      <ProgressGraphs />
    </div>
  );
}
