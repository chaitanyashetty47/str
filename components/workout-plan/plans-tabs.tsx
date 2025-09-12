"use client";

import { useEffect, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import WorkoutPlanCard from "@/components/workout-plan/workout-plan";
import { toast } from "sonner";
import { useAction } from "@/hooks/useAction";
import { getTrainerPlans } from "@/actions/plans/get-workout-plan.action";

export default function PlansTabs() {
  const callbacks = useMemo(
    () => ({
      onSuccess: () => toast.success("Workout plans loaded successfully"),
      onError: (msg: string | undefined) =>
        toast.error(msg ?? "Failed to load workout plans"),
    }),
    [],
  );

  const { execute, data, error: _error, isLoading } = useAction(
    getTrainerPlans,
    callbacks,
  );

  // Load on mount
  useEffect(() => {
    execute({} as never); // No input
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderGrid = (plans?: any[]) => {
    if (isLoading) {
      return <p className="text-center py-8">Loading...</p>;
    }

    if (!plans || plans.length === 0) {
      return (
        <p className="text-center py-8 text-muted-foreground">
          No plans in this category.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
        {plans.map((p) => (
          <WorkoutPlanCard key={p.id} plan={p} />
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="flex gap-2 rounded-full">
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="drafted">Drafted</TabsTrigger>
        <TabsTrigger value="previous">Previous</TabsTrigger>
        <TabsTrigger value="all">All</TabsTrigger>
      </TabsList>

      <TabsContent value="active">{renderGrid(data?.active)}</TabsContent>
      <TabsContent value="drafted">{renderGrid(data?.drafted)}</TabsContent>
      <TabsContent value="previous">{renderGrid(data?.previous)}</TabsContent>
      <TabsContent value="all">{renderGrid(data?.all)}</TabsContent>
    </Tabs>
  );
} 