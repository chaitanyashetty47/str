
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Calendar } from "lucide-react";
import { getTrainerDashboardData } from "@/actions/trainer.dashboard.action";
import { getBodyPartDisplayName } from "@/constants/workout-types";
import type { WorkoutType } from "@/types/trainer.dashboard";

// Helper function to format workout types for display
const formatWorkoutType = (type: WorkoutType): string => {
  return getBodyPartDisplayName(type);
};

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
      title: "Completed Sessions",
      value: dashboardData.stats.completedSessions.toString(),
      icon: Calendar,
      change: `+${Math.floor(dashboardData.stats.completedSessions / 5)} from last month`,
      changeType: "positive",
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
                    : "text-red-500"
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
              <h3 className="text-xl font-semibold">Upcoming Client Sessions</h3>
            </div>
            {dashboardData.upcomingSessions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Session Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.upcomingSessions.map((session, index) => (
                    <TableRow key={`${session.client}-${index}`}>
                      <TableCell>{session.client}</TableCell>
                      <TableCell>
                        {formatWorkoutType(session.sessionType)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{session.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                No Upcoming Sessions
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Recent Client Updates</h3>
            </div>
            {dashboardData.recentUpdates.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentUpdates.map((update, index) => (
                  <div
                    key={`${update.client}-${index}`}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{update.client}</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {update.action}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="bg-blue-50">
                          Week {update.weekNumber}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50">
                          Day {update.day}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50">
                          {formatWorkoutType(update.workoutType)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{update.time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                No Recent Updates
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 