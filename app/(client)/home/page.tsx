import Link from "next/link"
import { Dumbbell, Trophy, Flame, ArrowRight, User } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import ActiveSubscriptions from "@/components/active-subscriptions"
import UpcomingWorkouts, { UpcomingWorkoutsLoading } from "@/components/upcoming-workouts"
import ProgressGraphs from "@/components/progress-graphs"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server";
import { getClientCurrentWorkoutPlan } from "@/actions/clientworkout.action";
import { Suspense } from "react";


export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: workoutPlan, error: workoutPlanError } = await getClientCurrentWorkoutPlan();

  // Access the progress metrics
const { progressPercentage, currentWeek, totalWeeks, daysRemaining } = workoutPlan.progress;


  if (workoutPlanError) {
    return redirect("/home");
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Welcome back, {user.user_metadata.name}!</h1>
          <p className="text-xl text-muted-foreground mt-1">Let's crush today's goals! 👊</p>
        </div>
        {/* <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
          <Trophy className="h-5 w-5 text-blue-600" />
          <span className="text-base font-medium text-blue-800">Level 3</span>
        </div> */}
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-1">Workout Plan Progress</h2>
          <p className="text-muted-foreground mb-4">19 days left in your current plan</p>

          <Progress value={progressPercentage} className="h-2 mb-4" />
          <p className="text-muted-foreground mb-4">{daysRemaining} days left in your current plan</p>
             {/* <span className="font-medium">Currently on Week {currentWeek} of {totalWeeks}</span> */}

          {/* <div className="flex justify-between text-sm text-muted-foreground mb-4">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
            <span>Week 5</span>
            <span>Week 6</span>
            <span>Week 7</span>
            <span>Week 8</span>
          </div> */}

          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md w-fit">
            <Dumbbell className="h-5 w-5 text-gray-700" />
            <span className="font-medium">Currently on Week {currentWeek} of {totalWeeks}</span>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button className="w-full bg-black hover:bg-gray-800 text-white" asChild>
              <Link href="/workouts/logs?planId=1&week=1&day=1">
                <Dumbbell className="mr-2 h-5 w-5" />
                Log Workout
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/profile">
                <User className="mr-2 h-5 w-5" />
                Update Profile
              </Link>
            </Button>
          </div>
        </div>

        {/* <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-1">Experience Points</h2>
          <p className="text-muted-foreground mb-4">410/500 to next level</p>

          <Progress value={82} className="h-2 mb-4" />

          <div className="flex items-center gap-2 bg-yellow-100 p-2 rounded-md w-fit">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span className="font-medium">90 XP away from Level 4</span>
          </div>
        </div> */}
      </div>

      {/* Stats and Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-5xl font-bold">2</p>
              <p className="text-lg text-muted-foreground mt-1">Workouts Completed</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Dumbbell className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <Link href="/workouts" className="text-primary font-medium flex items-center">
            View details
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-5xl font-bold">1</p>
              <p className="text-lg text-muted-foreground mt-1">Day Streak</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Flame className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-muted-foreground">Keep it going!</p>
        </div>

        
      </div>

      {/* Subscriptions and Upcoming Workouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActiveSubscriptions />
        <Suspense fallback={<UpcomingWorkoutsLoading />}>
          <UpcomingWorkouts planId={workoutPlan.id} week={workoutPlan.progress.currentWeek} />
        </Suspense>
      </div>

      {/* Progress Graphs */}
      <ProgressGraphs />
    </div>
  )
}

