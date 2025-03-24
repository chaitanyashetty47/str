"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart,  Target, Award } from "lucide-react";

const clientProgress = [
  {
    name: "Alex Johnson",
    plan: "Strength Training",
    progress: 75,
    status: "On Track",
    metrics: {
      attendance: 90,
      goalCompletion: 85,
      improvement: "+12%",
    },
    recentMilestones: [
      "Completed 20 sessions",
      "Achieved weight goal",
      "New personal best in deadlift",
    ],
  },
  {
    name: "Maria Garcia",
    plan: "Weight Loss Program",
    progress: 45,
    status: "Behind Schedule",
    metrics: {
      attendance: 60,
      goalCompletion: 45,
      improvement: "-5%",
    },
    recentMilestones: [
      "Completed 10 sessions",
      "Started nutrition plan",
    ],
  },
  {
    name: "Sam Wilson",
    plan: "HIIT Training",
    progress: 95,
    status: "Exceeding Goals",
    metrics: {
      attendance: 95,
      goalCompletion: 100,
      improvement: "+20%",
    },
    recentMilestones: [
      "Completed program",
      "Achieved all targets",
      "Ready for advanced program",
    ],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "On Track":
      return "success";
    case "Behind Schedule":
      return "warning";
    case "Exceeding Goals":
      return "success";
    default:
      return "default";
  }
};

const getProgressColor = (progress: number) => {
  if (progress >= 80) return "bg-green-500";
  if (progress >= 60) return "bg-blue-500";
  if (progress >= 40) return "bg-yellow-500";
  return "bg-red-500";
};

export default function ClientProgressPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Client Progress</h2>
        <div className="flex gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="strength">Strength Training</SelectItem>
              <SelectItem value="weight-loss">Weight Loss</SelectItem>
              <SelectItem value="hiit">HIIT Training</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <LineChart className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {clientProgress.map((client) => (
          <Card key={client.name}>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-4">
                {/* Client Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.plan}</p>
                  <Badge variant={getStatusColor(client.status) as any}>
                    {client.status}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{client.progress}%</span>
                  </div>
                  <Progress
                    value={client.progress}
                    className={getProgressColor(client.progress)}
                  />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <Target className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">
                      {client.metrics.attendance}%
                    </div>
                    <div className="text-xs text-muted-foreground">Attendance</div>
                  </div>
                  <div className="text-center">
                    <Award className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">
                      {client.metrics.goalCompletion}%
                    </div>
                    <div className="text-xs text-muted-foreground">Goals Met</div>
                  </div>
                  <div className="text-center">
                    {client.metrics.improvement.startsWith("+") ? (
                      <Target className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    ) : (
                      <Target className="h-5 w-5 mx-auto mb-1 text-red-500" />
                    )}
                    <div className="text-sm font-medium">
                      {client.metrics.improvement}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Improvement
                    </div>
                  </div>
                </div>

                {/* Recent Milestones */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Recent Milestones</h4>
                  <ul className="text-sm space-y-1">
                    {client.recentMilestones.map((milestone, index) => (
                      <li
                        key={index}
                        className="text-muted-foreground flex items-center gap-2"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {milestone}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 