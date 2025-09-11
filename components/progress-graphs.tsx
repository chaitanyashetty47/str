import { WeightAreaChart } from "@/components/WeightAreaChart";
import { WeightLogOutput } from "@/actions/client-workout/client-workout.action";

interface ProgressGraphsProps {
  weightLogs: WeightLogOutput[] | undefined;
}

export default function ProgressGraphs({ weightLogs }: ProgressGraphsProps) {
  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-1">Progress Overview</h2>
      <p className="text-muted-foreground mb-6">Track your fitness journey over time</p>

      <WeightAreaChart data={weightLogs || []} />
    </div>
  );
}

