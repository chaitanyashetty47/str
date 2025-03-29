import { Card, CardContent } from "@/components/ui/card";
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
import { LineChart, Target, Award, ExternalLink } from "lucide-react";
import { getClientsProgress } from "@/actions/trainer.action";
import Link from "next/link";

// Helper functions for UI display
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

export default async function ClientProgressPage() {
  const { data: clientProgress, error } = await getClientsProgress();
  
  // Handle potential errors
  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-medium">Error loading client progress</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  
  // Handle empty client list
  if (!clientProgress || clientProgress.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-medium">No clients found</h3>
          <p className="text-muted-foreground">You currently have no active clients with workout plans.</p>
        </div>
      </div>
    );
  }

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
              <SelectItem value="hypertrophy">Hypertrophy</SelectItem>
              <SelectItem value="endurance">Endurance</SelectItem>
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
          <Card key={client.id}>
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
                  <Link 
                    href={`/training/progress/logs/${client.planId}`}
                    className="inline-flex items-center gap-1 text-sm font-medium mt-4 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    View Detailed Progress <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 