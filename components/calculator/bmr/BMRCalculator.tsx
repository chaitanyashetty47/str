"use client"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAction } from "@/hooks/useAction";
import { addBMR } from "@/actions/body-measurement-metrics/add-bmr.action";
import { getBMR } from "@/actions/body-measurement-metrics/get-bmr.action";
import { calculateBMRAction } from "@/actions/body-measurement-metrics/calculate-bmr.action";
import  BMRAreaChart  from "./BMRAreaChart";
import useSWR from "swr";
import { getWeightUnit } from "@/actions/profile/get-weight-unit.action";
import { WeightUnit, ActivityLevel, Gender } from "@prisma/client";
import { convertFromKg } from "@/utils/weight";
import { convertToKG } from "@/utils/weight-conversions";
import { updateTodaysWeight } from "@/actions/body-measurement-metrics/update-todays-weight.action";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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



// Fetcher for server actions
async function fetchTodaysWeight() {
  const mod = await import("@/actions/body-measurement-metrics/get-todays-weight.action");
  const result = await mod.getTodaysWeight({});
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

export default function BMRCalculator({ 
  initialWeight, 
  initialHeight, 
  initialAge, 
  initialGender, 
  initialActivityLevel 
}: { 
  initialWeight: number, 
  initialHeight: number, 
  initialAge: number, 
  initialGender: Gender, 
  initialActivityLevel: ActivityLevel 
}) {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [weight, setWeight] = useState(initialWeight);
  const [height, setHeight] = useState(initialHeight);
  const [age, setAge] = useState(initialAge);
  const [gender, setGender] = useState<Gender>(initialGender);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialActivityLevel);
  const [userWeightUnit, setUserWeightUnit] = useState<WeightUnit>(WeightUnit.KG);
  const [weightData, setWeightData] = useState<{
    weight: number;
    source: 'weight_logs' | 'profile';
    isLocked: boolean;
    weightUnit: 'KG' | 'LB';
  } | null>(null);
  const [saveNewWeight, setSaveNewWeight] = useState(false);
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

  // Update local weight data when fetched
  useEffect(() => {
    if (todaysWeightData) {
      setWeightData(todaysWeightData);
      // Set initial weight based on today's data
      if (todaysWeightData.source === 'weight_logs') {
        // Weight already logged today, use that value
        setWeight(todaysWeightData.weightUnit === 'KG' ? todaysWeightData.weight : convertFromKg(todaysWeightData.weight, WeightUnit.LB));
        setSaveNewWeight(false); // Cannot save new weight if already logged
      } else {
        // Weight from profile, allow editing and saving
        setWeight(todaysWeightData.weightUnit === 'KG' ? todaysWeightData.weight : convertFromKg(todaysWeightData.weight, WeightUnit.LB));
        setSaveNewWeight(true); // Can save new weight
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
  const displayHeight = height; // Height always in CM for BMR calculation

  // State for server-calculated BMR
  const [bmrResult, setBmrResult] = useState<{bmr: number, dailyCalories: number} | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate BMR server-side when data changes
  useEffect(() => {
    const calculateBMR = async () => {
      if (weight > 0 && height > 0 && age > 0) {
        setIsCalculating(true);
        try {
          const result = await calculateBMRAction({
            weight,
            height,
            age,
            gender,
            activityLevel,
            weightUnit: userWeightUnit
          });
          
          if (result.data) {
            setBmrResult({
              bmr: result.data.bmr,
              dailyCalories: result.data.dailyCalories
            });
          }
        } catch (error) {
          console.error("Error calculating BMR:", error);
        } finally {
          setIsCalculating(false);
        }
      } else {
        setBmrResult(null);
      }
    };

    calculateBMR();
  }, [weight, height, age, gender, activityLevel, userWeightUnit]);

  // Use calculated values or show placeholders
  const bmr = bmrResult?.bmr || 0;
  const dailyCalories = bmrResult?.dailyCalories || 0;

  // SWR for BMR data
  const { data: bmrData, mutate: mutateBMRData, isLoading: isBMRDataLoading } = useSWR(
    "allBMR", 
    async () => {
      const result = await getBMR({ page: 0, pageSize: 1000 });
      return result.data || { entries: [], total: 0, latest: null };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  // Pagination state (client-side)
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Derived state from bmrData
  const bmrEntries = bmrData?.entries || [];
  const total = bmrData?.total || 0;
  const latest = bmrData?.latest || null;
  const paginatedEntries = bmrEntries.slice(page * pageSize, (page + 1) * pageSize);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * pageSize < bmrEntries.length;

  // Add BMR action
  const {
    execute: addBMRAction,
    isLoading: isAdding,
    error: addError,
  } = useAction(addBMR, {
    onSuccess: async (result) => {
      try {
        // Close form immediately to prevent flashing
        setShowAddForm(false);
        
        // If user chose to save new weight, update weight_logs
        if (saveNewWeight && user) {
          const weightInKG = convertToKG(weight, userWeightUnit);
          await updateTodaysWeight({ weight: weightInKG, weightUnit: 'KG' });
          // Refresh today's weight data
          mutateTodaysWeight();
        }
        
        // Refetch all BMR data
        mutateBMRData();
      } finally {
        // Mark that we're done submitting
        isSubmittingRef.current = false;
      }
    },
    onError: () => {
      // Reset submission state on error
      isSubmittingRef.current = false;
    },
  });

  // Check if BMR for today exists
  const todayISO = getTodayISODate();
  const hasTodayEntry = bmrEntries.some(entry => getDateOnly(entry.date) === todayISO);

  function handleAddBMR({ 
    weight, 
    height, 
    age, 
    gender, 
    activityLevel 
  }: { 
    weight: number, 
    height: number, 
    age: number, 
    gender: Gender, 
    activityLevel: ActivityLevel 
  }) {
    // Mark that we're submitting to prevent dialog flickering
    isSubmittingRef.current = true;
    
    // Get current date in client's timezone (YYYY-MM-DD format)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const clientDate = `${year}-${month}-${day}`;
    
    // Send the data to the server
    addBMRAction({ 
      weight, 
      height, 
      age, 
      gender, 
      activityLevel, 
      userWeightUnit, 
      clientDate, 
      saveNewWeight: false // We handle weight saving separately
    });
  }

  return (
    <div className="flex flex-col md:flex-row w-full gap-8">
      {/* Left: Main BMR Results content */}
      <div className="max-w-3xl w-full">
        <div className="flex flex-row justify-between">
          <h1 className="text-2xl font-bold">BMR Results</h1>
          <div className="flex flex-row gap-2">
            <Button className="bg-strentor-red text-white"
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={hasTodayEntry || isAdding}
              title={hasTodayEntry ? "You have already inputted today's data." : undefined}
            >
              <PlusIcon className="w-4 h-4" /> {showAddForm ? "Cancel" : "Add New BMR"}
            </Button>
          </div>
        </div>
        
        {/* Current BMR Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 text-center border">
            <h3 className="text-lg font-medium text-gray-500">Your BMR</h3>
            <div className="text-4xl font-bold text-blue-600">
              {isCalculating ? "..." : (bmr > 0 ? Math.round(bmr) : "---")}
            </div>
            <p className="text-sm text-gray-600">calories/day</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center border">
            <h3 className="text-lg font-medium text-gray-500">Daily Calories</h3>
            <div className="text-4xl font-bold text-green-600">
              {isCalculating ? "..." : (dailyCalories > 0 ? Math.round(dailyCalories) : "---")}
            </div>
            <p className="text-sm text-gray-600">with activity</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center border">
            <h3 className="text-lg font-medium text-gray-500">Activity Level</h3>
            <div className="text-2xl font-bold text-purple-600">{activityLevel.replace('_', ' ')}</div>
            <p className="text-sm text-gray-600">
              multiplier: {bmr > 0 ? (dailyCalories / bmr).toFixed(2) : "---"}
            </p>
          </div>
        </div>

        {/* Add BMR Form - Hidden div that appears above chart */}
        {showAddForm && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New BMR</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {weightData?.source === 'weight_logs' 
                    ? "Weight already logged for today - using that value"
                    : "Weight from profile - can be updated"}
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
                      disabled={true}
                    />
                    <span className="inline-flex items-center px-3 py-2 text-sm text-muted-foreground bg-muted border border-l-0 rounded-r-md">
                      cm
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label>Age</Label>
                  <Input 
                    type="number" 
                    value={age} 
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                    disabled={true}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={(value) => setGender(value as Gender)} disabled={true}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label>Activity Level</Label>
                  <Select value={activityLevel} onValueChange={(value) => setActivityLevel(value as ActivityLevel)} disabled={true}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ActivityLevel.SEDENTARY}>Sedentary</SelectItem>
                      <SelectItem value={ActivityLevel.LIGHTLY_ACTIVE}>Lightly Active</SelectItem>
                      <SelectItem value={ActivityLevel.MODERATELY_ACTIVE}>Moderately Active</SelectItem>
                      <SelectItem value={ActivityLevel.VERY_ACTIVE}>Very Active</SelectItem>
                      <SelectItem value={ActivityLevel.EXTRA_ACTIVE}>Extra Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {!weightData?.isLocked && !isTodayWeightLogged && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="saveNewWeight"
                      checked={saveNewWeight}
                      onChange={(e) => setSaveNewWeight(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="saveNewWeight" className="text-sm">
                      Save as today's weight
                    </Label>
                  </div>
                )}
                
                {addError && <div className="text-red-500 text-sm">{addError}</div>}
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleAddBMR({ weight, height, age, gender, activityLevel })} 
                    disabled={!weight || !height || !age || isAdding}
                    className="bg-strentor-red text-white"
                  >
                    {isAdding ? "Adding..." : "Add BMR"}
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
          <BMRAreaChart data={bmrEntries.map(e => ({
            ...e,
            date: typeof e.date === 'string'
              ? e.date
              : e.date instanceof Date
                ? e.date.toISOString().split('T')[0]
                : String(e.date),
          }))} />
        </div>

        {/* BMR History Table */}
        <div className="grid grid-cols-7 gap-6 mt-8">
          <div className="col-span-2">
            <h1 className="text-md font-bold">Date</h1>
          </div>
          <div className="col-span-1">
            <h1 className="text-md font-bold">BMR</h1>
          </div>
          <div className="col-span-1">
            <h1 className="text-md font-bold">Daily Calories</h1>
          </div>
          <div className="col-span-2">
            <h1 className="text-md font-bold">Inputs</h1>
          </div>
          <div className="col-span-1">
            <h1 className="text-md font-bold">Activity</h1>
          </div>
        </div>
        
        {isBMRDataLoading ? (
          <div className="py-4 text-center text-gray-500">Loading...</div>
        ) : paginatedEntries.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No BMR entries found.</div>
        ) : (
          paginatedEntries.map((item, idx) => (
            <div key={`${item.date.toISOString()}-${item.bmr}-${idx}`} className="grid grid-cols-7 gap-6 border-b py-2">
              <div className="col-span-2">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div className="col-span-1 font-semibold text-blue-600">{Math.round(item.bmr)}</div>
              <div className="col-span-1 font-semibold text-green-600">{Math.round(item.dailyCalories)}</div>
              <div className="col-span-2">
                W: {userWeightUnit === WeightUnit.KG ? (item.weight || 0) : convertFromKg(item.weight || 0, WeightUnit.LB).toFixed(1)} {userWeightUnit === WeightUnit.KG ? "kg" : "lbs"}, H: {item.height || 0}cm, Age: {item.age || 0}
              </div>
              <div className="col-span-1 text-sm">{(item.activityLevel || '').replace('_', ' ')}</div>
            </div>
          ))
        )}
        
        <div className="flex flex-row justify-between mt-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!hasPrev || isBMRDataLoading}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext || isBMRDataLoading}>Next</Button>
        </div>
        

      </div>
      
      {/* Right: BMR Information card */}
      <div className="flex-1 min-w-[280px] flex justify-center md:justify-start mt-8 md:mt-0">
        <div className="w-full md:w-80 max-w-xs">
          <div className="bg-white rounded-lg shadow p-6 space-y-6 border">
            <div>
              <h3 className="text-lg font-medium text-gray-500">What is BMR?</h3>
              <p className="text-sm text-gray-600 mt-2">
                Basal Metabolic Rate (BMR) is the number of calories your body needs to maintain basic life functions at rest.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Activity Level Multipliers:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sedentary:</span>
                  <span className="font-medium">1.2</span>
                </div>
                <div className="flex justify-between">
                  <span>Lightly Active:</span>
                  <span className="font-medium">1.375</span>
                </div>
                <div className="flex justify-between">
                  <span>Moderately Active:</span>
                  <span className="font-medium">1.55</span>
                </div>
                <div className="flex justify-between">
                  <span>Very Active:</span>
                  <span className="font-medium">1.725</span>
                </div>
                <div className="flex justify-between">
                  <span>Extra Active:</span>
                  <span className="font-medium">1.9</span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                <strong>Formula:</strong> Mifflin-St Jeor Equation
                <br />
                <strong>Men:</strong> (10 × weight) + (6.25 × height) - (5 × age) + 5
                <br />
                <strong>Women:</strong> (10 × weight) + (6.25 × height) - (5 × age) - 161
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}
