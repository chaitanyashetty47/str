"use client";

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
import Link from "next/link";
import { Users, Activity, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { getTrainerDashboardData } from "@/actions/trainer.dashboard.action";
import { Database } from "@/utils/supabase/types";

type WorkoutType = Database["public"]["Enums"]["workout_type"];

// Helper function to format workout types for display
const formatWorkoutType = (type: WorkoutType): string => {
  switch (type) {
    case "legs":
      return "Legs";
    case "chest_triceps":
      return "Chest & Triceps";
    case "back_biceps":
      return "Back & Biceps";
    case "full_body":
      return "Full Body";
    default:
      return type;
  }
};

export default function TrainerDashboard() {
  const [dashboardData, setDashboardData] = useState<{
    stats: {
      totalClients: number;
      activePlans: number;
      completedSessions: number;
    };
    upcomingSessions: {
      client: string;
      sessionType: WorkoutType;
      status: string;
    }[];
    recentUpdates: {
      client: string;
      action: string;
      time: string;
      weekNumber: number;
      day: number;
      workoutType: WorkoutType;
    }[];
  }>({
    stats: {
      totalClients: 0,
      activePlans: 0,
      completedSessions: 0,
    },
    upcomingSessions: [],
    recentUpdates: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Call the server action without the trainerId parameter
        const data = await getTrainerDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create stats array from the dashboard data
  const stats = [
    {
      title: "Total Clients",
      value: dashboardData.stats.totalClients.toString(),
      icon: Users,
      change: `+${Math.floor(dashboardData.stats.totalClients / 2)} from last month`,
      changeType: "positive",
    },
    {
      title: "Active Plans",
      value: dashboardData.stats.activePlans.toString(),
      icon: Activity,
      change: `-${Math.floor(dashboardData.stats.activePlans / 6)} from last month`,
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Trainer Dashboard</h2>
        <div className="flex gap-4">
          <Button>Assign New Plan</Button>
          <Button variant="outline">View All Clients</Button>
        </div>
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
              <p className={`text-sm mt-2 ${
                stat.changeType === "positive" ? "text-green-500" : "text-red-500"
              }`}>
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
                      <TableCell>{formatWorkoutType(session.sessionType)}</TableCell>
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
              <Button variant="link">View All Updates</Button>
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

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button className="w-full">Create Workout Plan</Button>
            <Button className="w-full" variant="outline">
              Add New Client
            </Button>
            <Button className="w-full" variant="outline">
              Check Progress Logs
            </Button>
            <Button className="w-full" variant="outline">
              Generate Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 