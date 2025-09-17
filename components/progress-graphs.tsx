"use client"
import { WeightAreaChart } from "@/components/WeightAreaChart";
import { WeightLogOutput } from "@/actions/client-workout/client-workout.action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, X, EditIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useAction } from "@/hooks/useAction";
import { updateTodaysWeight } from "@/actions/body-measurement-metrics/update-todays-weight.action";
import useSWR from "swr";
import { mutate } from "swr";
import { getWeightUnit } from "@/actions/profile/get-weight-unit.action";
import { WeightUnit } from "@prisma/client";
import { convertFromKg } from "@/utils/weight";
import { useAuth } from "@/contexts/AuthContext";

interface ProgressGraphsProps {
  weightLogs: WeightLogOutput[] | undefined;
}

// Helper functions (same pattern as BMI calculator)
function getTodayISODate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Fetcher for checking if today's weight is logged
async function fetchIsTodayWeightLogged() {
  const mod = await import("@/actions/body-measurement-metrics/is-today-weight-logged.action");
  
  // Get current client date
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const clientDate = `${year}-${month}-${day}`;
  
  const result = await mod.isTodayWeightLogged({ clientDate });
  return result.data?.isTodayWeightLogged;
}

// Fetcher for today's weight data
async function fetchTodaysWeight() {
  const mod = await import("@/actions/body-measurement-metrics/get-todays-weight.action");
  // Build client date in YYYY-MM-DD
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const clientDate = `${year}-${month}-${day}`;
  const result = await mod.getTodaysWeight({ clientDate });
  return result.data;
}

export default function ProgressGraphs({ weightLogs }: ProgressGraphsProps) {
  const { user } = useAuth();
  const [showAddWeightForm, setShowAddWeightForm] = useState(false);
  const [todayWeight, setTodayWeight] = useState<number | "">("");
  const [userWeightUnit, setUserWeightUnit] = useState<WeightUnit>(WeightUnit.KG);

  // SWR for user's weight unit preference
  const { data: weightUnit } = useSWR(
    "userWeightUnit", 
    async () => {
      const unit = await getWeightUnit();
      return unit;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // SWR for checking if weight is logged today
  const { data: isTodayWeightLogged, mutate: mutateIsTodayWeightLogged, error: isTodayWeightLoggedError } = useSWR(
    user ? "isTodayWeightLogged" : null, 
    fetchIsTodayWeightLogged,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // Fetch today's weight data
  const { data: todaysWeightData, mutate: mutateTodaysWeight, error: todaysWeightError } = useSWR(
    user ? "todaysWeight" : null,
    fetchTodaysWeight,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // Fetch weight logs (for chart refresh)
  const { data: swrWeightLogs, mutate: mutateWeightLogs } = useSWR(
    user ? "weightLogs" : null,
    async () => {
      const mod = await import("@/actions/client-workout/client-workout.action");
      const result = await mod.getUserWeightLogs({});
      return result.data;
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // Update local weight unit when fetched
  useEffect(() => {
    if (weightUnit) {
      setUserWeightUnit(weightUnit);
    }
  }, [weightUnit]);

  // Update local weight when today's weight data is fetched
  useEffect(() => {
    if (todaysWeightData && todaysWeightData.source === 'weight_logs') {
      // Pre-populate with today's logged weight
      const weight = todaysWeightData.weightUnit === 'KG' ? todaysWeightData.weight : convertFromKg(todaysWeightData.weight, WeightUnit.LB);
      setTodayWeight(weight);
    } else if (todaysWeightData && todaysWeightData.source === 'profile') {
      // If no weight logged today, use profile weight as starting point
      const weight = todaysWeightData.weightUnit === 'KG' ? todaysWeightData.weight : convertFromKg(todaysWeightData.weight, WeightUnit.LB);
      setTodayWeight(weight);
    }
  }, [todaysWeightData]);

  // Pre-populate weight when form opens
  useEffect(() => {
    if (showAddWeightForm && todaysWeightData) {
      const weight = todaysWeightData.weightUnit === 'KG' ? todaysWeightData.weight : convertFromKg(todaysWeightData.weight, WeightUnit.LB);
      setTodayWeight(weight);
    }
  }, [showAddWeightForm, todaysWeightData]);

  // Update today's weight action
  const {
    execute: updateWeightAction,
    isLoading: isUpdating,
    error: updateError,
  } = useAction(updateTodaysWeight, {
    onSuccess: async () => {
      // Close form
      setShowAddWeightForm(false);
      
      // Refresh all data using global mutate
      setTimeout(() => {
        mutate("isTodayWeightLogged");
        mutate("todaysWeight");
        mutate("weightLogs");
      }, 100);
    },
  });

  function handleUpdateWeight({ weight }: { weight: number | "" }) {
    // Validate weight
    if (!weight || weight < 10) {
      return; // Don't submit if weight is empty or less than 10
    }
    
    // Get current date in client's timezone (YYYY-MM-DD format)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const clientDate = `${year}-${month}-${day}`;
    
    updateWeightAction({ 
      weight: Number(weight),
      weightUnit: userWeightUnit,
      clientDate,
    });
  }

  // Dynamic button text and icon
  const buttonText = isTodayWeightLogged ? "Update Today's Weight" : "Add Today's Weight";
  const buttonIcon = isTodayWeightLogged ? <EditIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />;

  // Debug logging
  console.log("ProgressGraphs Debug:", {
    user: user?.id,
    isTodayWeightLogged,
    todaysWeightData,
    showAddWeightForm,
    todayWeight,
    isTodayWeightLoggedError,
    todaysWeightError
  });

  return (
    <div className="border rounded-lg p-6">
      <div className="flex flex-row justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Progress Overview</h2>
          <p className="text-muted-foreground">Track your fitness journey over time</p>
        </div>
        <Button 
          className="bg-strentor-red text-white"
          onClick={() => setShowAddWeightForm(!showAddWeightForm)}
          disabled={isUpdating}
        >
          {showAddWeightForm ? <X className="w-4 h-4" /> : buttonIcon} 
          {showAddWeightForm ? "Cancel" : buttonText}
        </Button>
      </div>

      {/* Add Weight Form - Hidden div that appears above chart */}
      {showAddWeightForm && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>{isTodayWeightLogged ? "Update Today's Weight" : "Add Today's Weight"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Weight will be logged for today's date. 
                To permanently update your profile weight, go to <a href="/settings" className="text-blue-600 hover:underline">Settings</a>.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Weight</Label>
                <div className="flex">
                  <Input 
                    type="number" 
                    value={todayWeight} 
                    onChange={(e) => setTodayWeight(e.target.value === "" ? "" : Number(e.target.value))}
                    className="rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                    placeholder="Enter your weight"
                  />
                  <span className="inline-flex items-center px-3 py-2 text-sm text-muted-foreground bg-muted border border-l-0 rounded-r-md">
                    {userWeightUnit === WeightUnit.KG ? "kg" : "lbs"}
                  </span>
                </div>
              </div>
              {updateError && <div className="text-red-500 text-sm">{updateError}</div>}
              {todayWeight !== "" && todayWeight < 10 && (
                <div className="text-red-500 text-sm">Weight cannot be less than 10 {userWeightUnit === WeightUnit.KG ? "kg" : "lbs"}</div>
              )}
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleUpdateWeight({ weight: todayWeight })} 
                  disabled={!todayWeight || todayWeight < 10 || isUpdating}
                  className="bg-strentor-red text-white"
                >
                  {isUpdating ? "Updating..." : (isTodayWeightLogged ? "Update Weight" : "Add Weight")}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowAddWeightForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <WeightAreaChart data={swrWeightLogs || weightLogs || []} />
    </div>
  );
}

