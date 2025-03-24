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

const stats = [
  {
    title: "Total Clients",
    value: "24",
    icon: Users,
    change: "+12 from last month",
    changeType: "positive",
  },
  {
    title: "Active Plans",
    value: "18",
    icon: Activity,
    change: "-3 from last month",
    changeType: "negative",
  },
  {
    title: "Completed Sessions",
    value: "128",
    icon: Calendar,
    change: "+28 from last month",
    changeType: "positive",
  },
];

const upcomingSessions = [
  {
    client: "Alex Johnson",
    sessionType: "Strength Training",
    date: "Today, 10:00 AM",
    status: "Pending",
  },
  {
    client: "Maria Garcia",
    sessionType: "HIIT Cardio",
    date: "Today, 2:30 PM",
    status: "Pending",
  },
  {
    client: "Sam Wilson",
    sessionType: "Flexibility",
    date: "Tomorrow, 11:00 AM",
    status: "Pending",
  },
  {
    client: "Emily Chen",
    sessionType: "Strength Training",
    date: "Tomorrow, 3:00 PM",
    status: "Pending",
  },
  {
    client: "Raj Patel",
    sessionType: "Cardiovascular",
    date: "May 5, 10:00 AM",
    status: "Pending",
  },
];

const recentUpdates = [
  {
    client: "Alex Johnson",
    action: "Completed workout",
    time: "2 hours ago",
  },
  {
    client: "Maria Garcia",
    action: "Missed session",
    time: "Yesterday",
  },
  {
    client: "Sam Wilson",
    action: "Updated goals",
    time: "Yesterday",
  },
];

export default function TrainerDashboard() {
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Session Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingSessions.map((session) => (
                  <TableRow key={`${session.client}-${session.date}`}>
                    <TableCell>{session.client}</TableCell>
                    <TableCell>{session.sessionType}</TableCell>
                    <TableCell>{session.date}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{session.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="link" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Recent Client Updates</h3>
              <Button variant="link">View All Updates</Button>
            </div>
            <div className="space-y-4">
              {recentUpdates.map((update) => (
                <div
                  key={`${update.client}-${update.time}`}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{update.client}</p>
                    <p className="text-sm text-muted-foreground">
                      {update.action}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{update.time}</p>
                </div>
              ))}
            </div>
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