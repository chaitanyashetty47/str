"use client"
import { Button } from "@/components/ui/button"
import { PlusIcon, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAction } from "@/hooks/useAction";
import { addBodyFat } from "@/actions/body-measurement-metrics/add-body-fat.action";
import { updateTodaysWeight } from "@/actions/body-measurement-metrics/update-todays-weight.action";
import { BodyFatAreaChart } from "./BodyFatAreaChart";
import useSWR from "swr";
import { getWeightUnit } from "@/actions/profile/get-weight-unit.action";
import { WeightUnit, Gender } from "@prisma/client";
import { convertFromKg } from "@/utils/weight";
import { convertToKG } from "@/utils/weight-conversions";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
    case "essential":
      return "text-blue-600";
    case "athletes":
      return "text-green-600";
    case "fitness":
      return "text-yellow-600";
    case "average":
      return "text-orange-600";
    case "above average":
      return "text-orange-500";
    case "obese":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

// Client-side validation for measurements
function validateMeasurements(measurements: {
  height: number;
  waist: number;
  neck: number;
  hips?: number;
  gender: Gender;
}) {
  const errors: string[] = [];
  
  // Check for unrealistic measurements
  if (measurements.height < 100 || measurements.height > 250) {
    errors.push("Height measurement seems unrealistic. Please check if it's in centimeters.");
  }
  
  if (measurements.waist < 50 || measurements.waist > 200) {
    errors.push("Waist measurement seems unrealistic. Please check if it's in centimeters.");
  }
  
  if (measurements.neck < 25 || measurements.neck > 60) {
    errors.push("Neck measurement seems unrealistic. Please check if it's in centimeters.");
  }
  
  if (measurements.gender === Gender.FEMALE) {
    if (!measurements.hips) {
      errors.push("Hip measurement is required for women.");
    } else if (measurements.hips < 70 || measurements.hips > 200) {
      errors.push("Hip measurement seems unrealistic. Please check if it's in centimeters.");
    }
  }
  
  // Check for impossible body fat scenarios
  if (measurements.waist <= measurements.neck) {
    errors.push("Waist measurement must be larger than neck measurement for accurate calculation.");
  }
  
  return errors;
}

// Fetcher for server actions
async function fetchIsTodayLogged() {
  const mod = await import("@/actions/body-measurement-metrics/is-today-body-fat-logged.action");
  
  // Get current client date
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const clientDate = `${year}-${month}-${day}`;
  
  const result = await mod.isTodayBodyFatLogged({ clientDate });
  return result.data?.isTodayLogged;
}

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

async function fetchAllBodyFat() {
  console.log('Fetching all body fat data...');
  const { getBodyFat } = await import("@/actions/body-measurement-metrics/get-body-fat.action");
  // Fetch all records (set pageSize to max allowed: 100)
  const result = await getBodyFat({ page: 0, pageSize: 100 });
  console.log('Fetched body fat data:', result);
  return result.data;
}

export default function BodyFatCalculator({ 
  initialHeight, 
  initialGender,
  initialMeasurements
}: { 
  initialHeight: number, 
  initialGender: Gender,
  initialMeasurements: {
    neck?: number;
    waist?: number;
    hips?: number;
  }
}) {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [height, setHeight] = useState(initialHeight);
  const [waist, setWaist] = useState(initialMeasurements.waist || 0);
  const [neck, setNeck] = useState(initialMeasurements.neck || 0);
  const [hips, setHips] = useState(initialMeasurements.hips || 0);
  const [gender, setGender] = useState<Gender>(initialGender);
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

  // SWR for all body fat data with optimized configuration
  const { data: bodyFatData, mutate: mutateBodyFatData, isLoading: isBodyFatDataLoading } = useSWR(
    "allBodyFat", 
    fetchAllBodyFat,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Pagination state (client-side)
  const [page, setPage] = useState(0);
  const pageSize = 5;

  // Derived state from bodyFatData
  const bodyFatEntries = bodyFatData?.entries || [];
  const total = bodyFatData?.total || 0;
  const latest = bodyFatData?.latest || null;
  const paginatedEntries = bodyFatEntries.slice(page * pageSize, (page + 1) * pageSize);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * pageSize < bodyFatEntries.length;

  // Debug logging
  console.log('Body fat data debug:', {
    bodyFatData,
    bodyFatEntries: bodyFatEntries.length,
    total,
    latest,
    paginatedEntries: paginatedEntries.length
  });

  // Add Body Fat action
  const {
    execute: addBodyFatAction,
    isLoading: isAdding,
    error: addError,
    fieldErrors,
  } = useAction(addBodyFat, {
    onSuccess: async (data) => {
      console.log('Body fat added successfully:', data);
      // Mark that we're done submitting
      isSubmittingRef.current = false;
      
      // Show success toast
      toast.success(`Body fat measurement added successfully! (${data?.bodyFatPercentage}%)`);
      
      // Close form
      setShowAddForm(false);
      
      // Delay SWR mutations to prevent re-render conflicts
      setTimeout(() => {
        console.log('Triggering SWR mutations...');
        mutateBodyFatData(); // Refetch all body fat data
        mutateIsTodayLogged(); // Refetch isTodayLogged
      }, 100);
    },
    onError: (error) => {
      console.error('Error adding body fat:', error);
      // Reset submission state on error
      isSubmittingRef.current = false;
      
      // Show error toast
      toast.error(error || 'Failed to add body fat measurement');
    },
    
  });

  // Check if body fat for today exists
  const todayISO = getTodayISODate();
  const hasTodayEntry = bodyFatEntries.some(entry => getDateOnly(entry.date) === todayISO);

  function handleAddBodyFat({ 
    height, 
    waist, 
    neck, 
    hips
  }: { 
    height: number, 
    waist: number, 
    neck: number, 
    hips: number
  }) {
    console.log('handleAddBodyFat called with:', { height, waist, neck, hips, gender });
    
    // Client-side validation
    const validationErrors = validateMeasurements({
      height,
      waist,
      neck,
      hips,
      gender
    });
    
    if (validationErrors.length > 0) {
      // Show validation errors in toast
      validationErrors.forEach(error => {
        toast.error(error);
      });
      return;
    }
    
    // Mark that we're submitting to prevent dialog flickering
    isSubmittingRef.current = true;
    
    // Get current date in client's timezone (YYYY-MM-DD format)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const clientDate = `${year}-${month}-${day}`; // This gives us the local date
    
    console.log('Sending data to server:', { 
      height, 
      waist, 
      neck, 
      hips, 
      gender, 
      clientDate 
    });
    
    // Send the data to the server
    addBodyFatAction({ 
      height,
      waist,
      neck,
      hips,
      gender,
      clientDate
    });
  }

  // Check if all required measurements are available
  const hasRequiredMeasurements = gender === Gender.MALE 
    ? (height > 0 && waist > 0 && neck > 0) 
    : (height > 0 && waist > 0 && neck > 0 && hips > 0);

  return (
    <div className="flex flex-col md:flex-row w-full gap-8">
      {/* Left: Main Body Fat Results content */}
      <div className="max-w-3xl w-full">
        <div className="flex flex-row justify-between mb-6">
          <h1 className="text-2xl font-bold">Body Fat Results</h1>
          <div className="flex flex-row gap-2">
            <Button className="bg-strentor-red text-white"
              onClick={() => setShowAddForm(!showAddForm)}
              disabled={isTodayLogged || isAdding || !hasRequiredMeasurements}
              title={!hasRequiredMeasurements ? "Please complete your measurements in Settings" : isTodayLogged ? "You have already inputted today's data." : undefined}
            >
              {showAddForm ? <X className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />} {showAddForm ? "Cancel" : "Add New Body Fat"}
            </Button>
          </div>
        </div>
        
        {/* Add Body Fat Form - Hidden div that appears above chart */}
        {showAddForm && (
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Body Fat</CardTitle>
                
              </CardHeader>
                <CardContent className="space-y-4">
                 <div className="flex flex-col gap-2">
                   <Label>Height (cm)</Label>
                   <Input 
                     type="number" 
                     value={height} 
                     onChange={(e) => setHeight(Number(e.target.value))}
                     className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                     placeholder="e.g., 175"
                   />
                   <p className="text-sm text-muted-foreground">
                     Enter your height in centimeters
                   </p>
                 </div>
                
                                                   <div className="flex flex-col gap-2">
                    <Label>Waist (cm)</Label>
                    <Input 
                      type="number" 
                      value={waist} 
                      onChange={(e) => setWaist(Number(e.target.value))}
                      className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                      placeholder="e.g., 85"
                    />
                    <p className="text-sm text-muted-foreground">
                      Measure around your natural waistline (navel level for men)
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Label>Neck (cm)</Label>
                    <Input 
                      type="number" 
                      value={neck} 
                      onChange={(e) => setNeck(Number(e.target.value))}
                      className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                      placeholder="e.g., 38"
                    />
                    <p className="text-sm text-muted-foreground">
                      Measure just underneath the larynx (Adam's apple)
                    </p>
                  </div>
                
                                 {gender === Gender.FEMALE && (
                   <div className="flex flex-col gap-2">
                     <Label>Hips (cm)</Label>
                     <Input 
                       type="number" 
                       value={hips} 
                       onChange={(e) => setHips(Number(e.target.value))}
                       className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-blue-500"
                       placeholder="e.g., 95"
                     />
                     <p className="text-sm text-muted-foreground">
                       Measure at the widest part of your buttocks or hips
                     </p>
                   </div>
                 )}
                
                
                
                {addError && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                    <p className="font-medium mb-1">Calculation Error:</p>
                    <p>{addError}</p>
                    <p className="text-xs mt-2 text-red-600">
                      Please check your measurements and try again. Make sure all values are in centimeters.
                    </p>
                  </div>
                )}
                {fieldErrors && Object.keys(fieldErrors).length > 0 && (
                  <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">
                    <p className="font-medium mb-2">Please fix the following errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(fieldErrors).map(([field, errors]) => 
                        errors?.map((error, index) => (
                          <li key={`${field}-${index}`}>{field}: {error}</li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
                <div className="flex gap-2">
                                     <Button 
                     onClick={() => {
                       console.log('Button clicked!');
                       console.log('Current values:', { height, waist, neck, hips, gender });
                       console.log('Button disabled check:', {
                         noHeight: !height,
                         noWaist: !waist,
                         noNeck: !neck,
                         femaleMissingHips: gender === Gender.FEMALE && !hips,
                         isAdding
                       });
                       handleAddBodyFat({ height, waist, neck, hips });
                     }} 
                     disabled={!height || !waist || !neck || (gender === Gender.FEMALE && !hips) || isAdding}
                     className="bg-strentor-red text-white"
                   >
                     {isAdding ? "Adding..." : "Add Body Fat"}
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
          <BodyFatAreaChart data={bodyFatEntries.map(e => ({
            ...e,
            date: typeof e.date === 'string'
              ? e.date
              : e.date instanceof Date
                ? e.date.toISOString().split('T')[0]
                : String(e.date),
          }))} />
        </div>
        
        {/* Body Fat History Table */}
        <div className="grid grid-cols-6 gap-6 mt-8">
          <div className="col-span-1">
            <h1 className="text-md font-bold">Result</h1>
          </div>
          <div className="col-span-2">
            <h1 className="text-md font-bold">Date</h1>
          </div>
          <div className="col-span-1">
            <h1 className="text-md font-bold">Category</h1>
          </div>
          <div className="col-span-2">
            <h1 className="text-md font-bold">Inputs</h1>
          </div>
        </div>
        
        {isBodyFatDataLoading ? (
          <div className="py-4 text-center text-gray-500">Loading...</div>
        ) : paginatedEntries.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No body fat entries found.</div>
        ) : (
          paginatedEntries.map((item, idx) => {
            const inputs = item.inputs as any;
            const category = getCategoryColor(inputs?.category || "Average");
            return (
              <div key={`${item.date.toISOString()}-${item.bodyFatPercentage}-${idx}`} className="grid grid-cols-6 gap-6 border-b py-2">
                <div className="col-span-1">
                  <span className={`font-semibold ${category}`}>
                    {item.bodyFatPercentage}%
                  </span>
                </div>
                <div className="col-span-2">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="col-span-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${category} bg-opacity-10`}>
                    {inputs?.category || "Average"}
                  </span>
                </div>
                                 <div className="col-span-2">
                   Height: {inputs?.height}cm, Waist: {inputs?.waist}cm, Neck: {inputs?.neck}cm
                   {inputs?.gender === 'FEMALE' && `, Hips: ${inputs?.hips}cm`}
                 </div>
              </div>
            );
          })
        )}
        
        <div className="flex flex-row justify-between mt-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!hasPrev || isBodyFatDataLoading}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext || isBodyFatDataLoading}>Next</Button>
        </div>

      </div>
      
      {/* Right: Body Fat Information card */}
      <div className="flex-1 min-w-[280px] flex justify-center md:justify-start mt-8 md:mt-0">
        <div className="w-full md:w-80 max-w-xs">
          <div className="bg-white rounded-lg shadow p-6 space-y-6 border">
                         <div>
               <h3 className="text-lg font-medium text-gray-500">What is Body Fat %?</h3>
               <p className="text-sm text-gray-600 mt-2">
                 Body fat percentage is the proportion of your body weight that consists of fat tissue. It's a key indicator of health and fitness.
               </p>
               <p className="text-sm text-gray-500 mt-2">
                 <strong>Navy Standards:</strong> The US Navy uses specific body fat limits based on age and gender for service members.
               </p>
             </div>
            
                         <div>
               <h4 className="font-medium text-gray-700 mb-2">Body Fat Categories:</h4>
               <div className="space-y-2 text-sm">
                 <div className="flex justify-between">
                   <span className="text-blue-600">Essential:</span>
                   <span className="font-medium">Men: 2-5%, Women: 10-13%</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-green-600">Athletes:</span>
                   <span className="font-medium">Men: 6-13%, Women: 14-20%</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-yellow-600">Fitness:</span>
                   <span className="font-medium">Men: 14-17%, Women: 21-24%</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-orange-600">Average:</span>
                   <span className="font-medium">Men: 18-21%, Women: 25-31%</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-orange-500">Above Average:</span>
                   <span className="font-medium">Men: 22-25%, Women: 32-35%</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-red-600">Obese:</span>
                   <span className="font-medium">Men: 26%+, Women: 36%+</span>
                 </div>
               </div>
             </div>
            
                         <div className="pt-4 border-t">
               <p className="text-sm text-gray-600">
                 <strong>Formula:</strong> Navy Body Fat Formula (2024)
                 <br />
                 <strong>Men:</strong> %BF = 495 / (1.0324 − 0.19077 × log10(waist − neck) + 0.15456 × log10(height)) − 450
                 <br />
                 <strong>Women:</strong> %BF = 495 / (1.29579 − 0.35004 × log10(waist + hip − neck) + 0.22100 × log10(height)) − 450
               </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
} 