import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Activity, Calendar, User, Weight, ArrowRight } from "lucide-react";
import { getTrainerDashboardData } from "@/actions/trainer.dashboard.action";

export default async function TrainerDashboard() {
  // Fetch data using the server action
  const dashboardData = await getTrainerDashboardData();

  // Create stats array from the dashboard data
  const stats = [
    {
      title: "Total Clients",
      value: dashboardData.stats.totalClients.toString(),
      icon: Users,
      change: `+${Math.floor(dashboardData.stats.totalClients / 10)} from last month`,
      changeType: "positive",
    },
    {
      title: "Active Plans",
      value: dashboardData.stats.activePlans.toString(),
      icon: Activity,
      change: `-${Math.floor(dashboardData.stats.activePlans / 20)} from last month`,
      changeType: "negative",
    },
    {
      title: "Week Progress",
      value: `${dashboardData.stats.weekProgressPercentage}%`,
      icon: Calendar,
      change: "across all clients",
      changeType: "neutral",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Trainer Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p
                className={`text-sm mt-2 ${
                  stat.changeType === "positive"
                    ? "text-green-500"
                    : stat.changeType === "negative"
                    ? "text-red-500"
                    : "text-blue-500"
                }`}
              >
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Upcoming Workouts</h3>
              <span className="text-sm text-muted-foreground">Next 7 days</span>
            </div>
            {dashboardData.upcomingWorkouts.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.upcomingWorkouts.map((workout, index) => (
                  <div
                    key={`${workout.client}-${workout.scheduledDate}-${index}`}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{workout.client}</p>
                        <p className="text-sm text-muted-foreground">
                          {workout.workoutTitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(workout.scheduledDate).toLocaleDateString()}
                        </p>
                        <Badge 
                          variant={workout.status === "completed" ? "default" : "secondary"}
                        >
                          {workout.status}
                        </Badge>
                      </div>
                    </div>
                    
                    {workout.exercises.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Exercises:</p>
                        <ul className="text-sm space-y-1">
                          {workout.exercises.slice(0, 3).map((exercise, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                              {exercise}
                            </li>
                          ))}
                          {workout.exercises.length > 3 && (
                            <li className="text-xs text-muted-foreground">
                              +{workout.exercises.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                No Upcoming Workouts
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Recent Activity</h3>
              <span className="text-sm text-muted-foreground">Latest logs</span>
            </div>
            {dashboardData.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity, index) => (
                  <div
                    key={`${activity.client}-${activity.exerciseName}-${index}`}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{activity.client}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.exerciseName}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="bg-green-50">
                          {activity.weight}kg
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50">
                          {activity.reps} reps
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.loggedDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                No Recent Activity
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ongoing Plans Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Ongoing Plans</h3>
              <span className="text-sm text-muted-foreground">Active client plans</span>
            </div>
            {dashboardData.ongoingPlans.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-4">
                {dashboardData.ongoingPlans.map((plan) => (
                  <div
                    key={plan.planId}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          <p className="font-medium">{plan.clientName}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {plan.planTitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Week {plan.currentWeek} of {plan.totalWeeks}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Weekly Progress</span>
                        <span className="text-xs font-medium">{plan.weeklyProgressPercentage}%</span>
                      </div>
                      <Progress value={plan.weeklyProgressPercentage} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Overall Progress</span>
                        <span className="text-xs font-medium">{plan.overallProgressPercentage}%</span>
                      </div>
                      <Progress value={plan.overallProgressPercentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                No Active Plans
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Client PRs Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Recent Client Personal Records</h3>
            <span className="text-sm text-muted-foreground">Latest achievements</span>
          </div>

          {dashboardData.clientPRs && dashboardData.clientPRs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">
                      Client
                    </th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">
                      Exercise
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
                  {dashboardData.clientPRs.map((pr, index) => (
                    <tr
                      key={pr.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? "bg-gray-50/50" : ""
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-gray-900">{pr.clientName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-gray-900">
                        {pr.exerciseName}
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
                      <td className="py-4 px-4 text-right text-gray-500">
                        {new Date(pr.date).toLocaleDateString()}
                      </td>
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
                Your clients haven't achieved any PRs yet!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 