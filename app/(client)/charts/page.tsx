import { getUserExerciseWeights } from "@/actions/exercise.weights.records.action";
import { ExerciseChartClient } from "@/components/charts/exercise-chart/exercise-chart-client";

export default async function ChartsPage() {
  const { data, error } = await getUserExerciseWeights();

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const exercises = Array.from(
    new Map((data || []).map((row) => [row.exercise_id, row.exercise_name])).entries()
  ).map(([id, name]) => ({ id, name }));

  return (
    <div className="flex flex-col gap-4 min-w-[320px] w-full max-w-2xl mx-auto">
      <h1>Charts</h1>
      <ExerciseChartClient exercises={exercises} data={data || []} />
    </div>
  );
}