"use client"
import { Button } from "@/components/ui/button"
import { PlusIcon, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAction } from "@/hooks/useAction";
import { addBMI } from "@/actions/body-measurement-metrics/add-bmi.action";
import { BMIAreaChart } from "./BMIAreaChart";
import useSWR from "swr";
import { getWeightUnit } from "@/actions/profile/client/get-weight-unit.action";
import { WeightUnit } from "@prisma/client";
import { convertFromKg } from "@/utils/weight";
import { useAuth } from "@/contexts/AuthContext";

function getTodayISODate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to extract YYYY-MM-DD from a date string
function getDateOnly(date: string | Date) {
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

function getCategoryColor(category: string) {
  switch (category.toLowerCase()) {
    case "underweight":
      return "text-blue-600";
    case "normal":
      return "text-green-600";
    case "overweight":
      return "text-yellow-600";
    case "obese":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

// Fetcher for server actions
async function fetchIsTodayLogged() {
  const mod = await import("@/actions/body-measurement-metrics/is-today-bmi-logged.action");
  
  // Get current client date
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const clientDate = `${year}-${month}-${day}`;
  
  const result = await mod.isTodayLogged({ clientDate });
  return result.data?.isTodayLogged;
}

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

async function fetchAllBMI() {
  const { getBMI } = await import("@/actions/body-measurement-metrics/get-bmi.action");
  // Fetch all records (set pageSize high)
  const result = await getBMI({ page: 0, pageSize: 1000 });
  return result.data;
}

export default function BMICalculator({ initialWeight, initialHeight }: { initialWeight: number, initialHeight: number }) {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [weight, setWeight] = useState(initialWeight);
  const [height, setHeight] = useState(initialHeight);
  const [userWeightUnit, setUserWeightUnit] = useState<WeightUnit>(WeightUnit.KG);
  const [weightData, setWeightData] = useState<{
    weight: number;
    source: 'weight_logs' | 'profile';
    isLocked: boolean;
    weightUnit: 'KG' | 'LB';
  } | null>(null);
  const isSubmittingRef = useRef(false);

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

  // Fetch today's weight data
  const { data: todaysWeightData, mutate: mutateTodaysWeight } = useSWR(
    user ? "todaysWeight" : null,
    fetchTodaysWeight,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // Update local weight data when fetched
  useEffect(() => {
    if (todaysWeightData) {
      setWeightData(todaysWeightData);
      // Set initial weight based on today's data
      if (todaysWeightData.source === 'weight_logs') {
        // Weight already logged today, use that value
        setWeight(todaysWeightData.weightUnit === 'KG' ? todaysWeightData.weight : convertFromKg(todaysWeightData.weight, WeightUnit.LB));
      } else {
        // Weight from profile, allow editing and saving
        setWeight(todaysWeightData.weightUnit === 'KG' ? todaysWeightData.weight : convertFromKg(todaysWeightData.weight, WeightUnit.LB));
      }
    }
  }, [todaysWeightData]);

  // Update local weight unit when fetched
  useEffect(() => {
    if (weightUnit) {
      setUserWeightUnit(weightUnit);
    }
  }, [weightUnit]);

  // Convert weight for display based on user's preference
  const displayWeight = userWeightUnit === WeightUnit.KG ? weight : convertFromKg(weight, WeightUnit.LB);
  const displayHeight = height; // Height always in CM for BMI calculation

  // SWR for isTodayLogged with optimized configuration
  const { data: isTodayLogged, mutate: mutateIsTodayLogged } = useSWR(
    "isTodayLogged", 
    fetchIsTodayLogged,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // SWR for checking if weight is logged today
  const { data: isTodayWeightLogged } = useSWR(
    "isTodayWeightLogged", 
    fetchIsTodayWeightLogged,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // SWR for all BMI data with optimized configuration
  const { data: bmiData, mutate: mutateBMIData, isLoading: isBMIDataLoading } = useSWR(
    "allBMI", 
    fetchAllBMI,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Pagination state (client-side)
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Derived state from bmiData
  const bmiEntries = bmiData?.entries || [];
  const total = bmiData?.total || 0;
  const latest = bmiData?.latest || null;
  const paginatedEntries = bmiEntries.slice(page * pageSize, (page + 1) * pageSize);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * pageSize < bmiEntries.length;

  // Add BMI action
  const {
    execute: addBMIAction,
    isLoading: isAdding,
    error: addError,
  } = useAction(addBMI, {
    onSuccess: async () => {
      // Mark that we're done submitting
      isSubmittingRef.current = false;
      
      // Close form
      setShowAddForm(false);
      
      // Delay SWR mutations to prevent re-render conflicts
      setTimeout(() => {
        mutateBMIData(); // Refetch all BMI data
        mutateIsTodayLogged(); // Refetch isTodayLogged
      }, 100);
    },
    onError: () => {
      // Reset submission state on error
      isSubmittingRef.current = false;
    },
  });

  // Check if BMI for today exists
  const todayISO = getTodayISODate();
  const hasTodayEntry = bmiEntries.some(entry => getDateOnly(entry.date) === todayISO);

  function handleAddBMI({ weight, height }: { weight: number, height: number }) {
    // Mark that we're submitting to prevent dialog flickering
    isSubmittingRef.current = true;
    
    // Get current date in client's timezone (YYYY-MM-DD format)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const clientDate = `${year}-${month}-${day}`; // This gives us the local date
    
    // Send the original weight in user's preferred unit to the server
    // Server will handle the conversion to KG for storage
    addBMIAction({ 
      weight, // Send original weight (could be in KG or LBS)
      height, 
      userWeightUnit, // Server will use this to convert to KG
      clientDate, // Send client's current date to avoid timezone issues
      // saveNewWeight: false // We handle weight saving separately now
    });
  }

  function getBmiCategory(bmi: number) {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }

  return (
    <div className="flex flex-col md:flex-row w-full gap-8">
      {/* Left: Main BMI Results content */}
      <div className="max-w-3xl w-full">
        <div className="flex flex-row justify-between mb-6">
          <h1 className="text-2xl font-bold">BMI Results</h1>
          <div className="flex flex-row gap-2">
            <Button className="bg-strentor-red text-white"
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={isTodayLogged || isAdding}
              title={isTodayLogged ? "You have already inputted today's data." : undefined}
            >
              {showAddForm ? <X className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />} {showAddForm ? "Cancel" : "Add New BMI"}
            </Button>
          </div>
        </div>
        
        {/* Add BMI Form - Hidden div that appears above chart */}
        {showAddForm && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New BMI</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Weight will be automatically logged for today's BMI calculation. 
                  To permanently update your profile weight and height, go to <a href="/settings" className="text-blue-600 hover:underline">Settings</a>.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>Weight</Label>
                  <div className="flex">
                    <Input 
                      type="number" 
                      value={weight} 
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                      disabled={weightData?.isLocked}
                    />
                    <span className="inline-flex items-center px-3 py-2 text-sm text-muted-foreground bg-muted border border-l-0 rounded-r-md">
                      {userWeightUnit === WeightUnit.KG ? "kg" : "lbs"}
                    </span>
                  </div>
                  {weightData?.isLocked && (
                    <p className="text-sm text-muted-foreground">
                      ⚠️ Weight is locked for today. Use the same weight across all calculators.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Height</Label>
                  <div className="flex">
                    <Input 
                      type="number" 
                      value={height} 
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                    />
                    <span className="inline-flex items-center px-3 py-2 text-sm text-muted-foreground bg-muted border border-l-0 rounded-r-md">
                      cm
                    </span>
                  </div>
                </div>
                {addError && <div className="text-red-500 text-sm">{addError}</div>}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleAddBMI({ weight, height })} 
                    disabled={!weight || !height || isAdding}
                    className="bg-strentor-red text-white"
                  >
                    {isAdding ? "Adding..." : "Add BMI"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex-1">
          <BMIAreaChart data={bmiEntries.map(e => ({
            ...e,
            date: typeof e.date === 'string'
              ? e.date
              : e.date instanceof Date
                ? e.date.toISOString().split('T')[0]
                : String(e.date),
          }))} />
        </div>
        <div className="grid grid-cols-7 gap-6">
          <div className="col-span-1">
            <h1 className="text-md font-bold">Result</h1>
          </div>
          <div className="col-span-2">
            <h1 className="text-md font-bold">Date</h1>
          </div>
          <div className="col-span-2">
            <h1 className="text-md font-bold">Category</h1>
          </div>
          <div className="col-span-2">
            <h1 className="text-md font-bold">Inputs</h1>
          </div>
        </div>
        {isBMIDataLoading ? (
          <div className="py-4 text-center text-gray-500">Loading...</div>
        ) : paginatedEntries.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No BMI entries found.</div>
        ) : (
          paginatedEntries.map((item, idx) => (
            <div key={`${item.date.toISOString()}-${item.bmi}-${idx}`} className="grid grid-cols-7 gap-6 border-b py-2">
              <div className="col-span-1">
                <span className={`font-semibold ${getCategoryColor(getBmiCategory(item.bmi))}`}>
                  {item.bmi}
                </span>
              </div>
              <div className="col-span-2">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div className="col-span-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(getBmiCategory(item.bmi))} bg-opacity-10`}>
                  {getBmiCategory(item.bmi)}
                </span>
              </div>
              <div className="col-span-2">
                Weight: {userWeightUnit === WeightUnit.KG ? item.weight : convertFromKg(item.weight, WeightUnit.LB).toFixed(1)} {userWeightUnit === WeightUnit.KG ? "kg" : "lbs"}, Height: {item.height}cm
              </div>
            </div>
          ))
        )}
        <div className="flex flex-row justify-between mt-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!hasPrev || isBMIDataLoading}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext || isBMIDataLoading}>Next</Button>
        </div>

      </div>
      {/* Right: BMI Latest Result card */}
      <div className="flex-1 min-w-[280px] flex justify-center md:justify-start mt-8 md:mt-0">
        {latest && (
          <div className="w-full md:w-80 max-w-xs">
            <div className="bg-white rounded-lg shadow p-6 text-center space-y-6 border">
              <div>
                <h3 className="text-lg font-medium text-gray-500">Latest Result</h3>
                <div className={`text-7xl font-bold ${getCategoryColor(getBmiCategory(latest.bmi))}`}>{latest.bmi}</div>
                <div className="mt-2 text-lg">
                  You are <span className={`font-medium ${getCategoryColor(getBmiCategory(latest.bmi))}`}>{getBmiCategory(latest.bmi)}</span>
                </div>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(getBmiCategory(latest.bmi))} bg-opacity-10`}>
                    {getBmiCategory(latest.bmi)}
                  </span>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div className="bg-blue-500 h-full w-1/4"></div>
                  <div className="bg-green-500 h-full w-1/4"></div>
                  <div className="bg-yellow-500 h-full w-1/4"></div>
                  <div className="bg-red-500 h-full w-1/4"></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>
                  Underweight
                  <br />
                  &lt;18.5
                </span>
                <span>
                  Normal
                  <br />
                  18.5-24.9
                </span>
                <span>
                  Overweight
                  <br />
                  25-29.9
                </span>
                <span>
                  Obese
                  <br />
                  &gt;30
                </span>
              </div>
              <div className="pt-4 border-t">
                <p className="text-gray-600">
                  Your ideal weight is <span className="font-medium">
                    {userWeightUnit === WeightUnit.KG 
                      ? ((22 * (latest.height / 100) * (latest.height / 100)).toFixed(1))
                      : convertFromKg((22 * (latest.height / 100) * (latest.height / 100)), WeightUnit.LB).toFixed(1)
                    } {userWeightUnit === WeightUnit.KG ? "kg" : "lbs"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

}

