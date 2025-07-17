"use client"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useAction } from "@/hooks/useAction";
import { addBMI } from "@/actions/body-measurement-metrics/add-bmi.action";
import { BMIAreaChart } from "./BMIAreaChart";
import useSWR from "swr";

function getTodayISODate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split("T")[0];
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
      return "text-blue-500";
    case "normal":
      return "text-green-500";
    case "overweight":
      return "text-yellow-500";
    case "obese":
      return "text-red-500";
    default:
      return "";
  }
}

// Fetcher for server actions
async function fetchIsTodayLogged() {
  const mod = await import("@/actions/body-measurement-metrics/is-today-logged.action");
  const result = await mod.isTodayLogged();
  return result.data?.isTodayLogged;
}

async function fetchAllBMI() {
  const { getBMI } = await import("@/actions/body-measurement-metrics/get-bmi.action");
  // Fetch all records (set pageSize high)
  const result = await getBMI({ page: 0, pageSize: 1000 });
  return result.data;
}

export default function BMICalculator({ initialWeight, initialHeight }: { initialWeight: number, initialHeight: number }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [weight, setWeight] = useState(initialWeight);
  const [height, setHeight] = useState(initialHeight);

  // SWR for isTodayLogged
  const { data: isTodayLogged, mutate: mutateIsTodayLogged } = useSWR("isTodayLogged", fetchIsTodayLogged);
  // SWR for all BMI data
  const { data: bmiData, mutate: mutateBMIData, isLoading: isBMIDataLoading } = useSWR("allBMI", fetchAllBMI);

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
    onSuccess: () => {
      setIsDialogOpen(false);
      mutateBMIData(); // Refetch all BMI data
      mutateIsTodayLogged(); // Refetch isTodayLogged
    },
  });

  // Check if BMI for today exists
  const todayISO = getTodayISODate();
  const hasTodayEntry = bmiEntries.some(entry => getDateOnly(entry.date) === todayISO);

  function handleAddBMI({ weight, height }: { weight: number, height: number }) {
    addBMIAction({ weight, height });
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
        <div className="flex flex-row justify-between">
          <h1 className="text-2xl font-bold">BMI Results</h1>
          <div className="flex flex-row gap-2">
            <Button className="bg-strentor-red text-white"
              onClick={() => setIsDialogOpen(true)}
              disabled={isTodayLogged || isAdding}
              title={isTodayLogged ? "You have already inputted today's data." : undefined}
            >
              <PlusIcon className="w-4 h-4" /> Add New BMI
            </Button>
          </div>
        </div>
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
        <div className="grid grid-cols-6 gap-6">
          <div className="col-span-1">
            <h1 className="text-md font-bold">Result</h1>
          </div>
          <div className="col-span-2">
            <h1 className="text-md font-bold">Date</h1>
          </div>
          <div className="col-span-3">
            <h1 className="text-md font-bold">Inputs</h1>
          </div>
        </div>
        {isBMIDataLoading ? (
          <div className="py-4 text-center text-gray-500">Loading...</div>
        ) : paginatedEntries.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No BMI entries found.</div>
        ) : (
          paginatedEntries.map((item, idx) => (
            <div key={item.date.toISOString() + item.bmi} className="grid grid-cols-6 gap-6 border-b py-2">
              <div className="col-span-1">{item.bmi}</div>
              <div className="col-span-2">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div className="col-span-3">
                Weight: {item.weight}kg, Height: {item.height}cm
              </div>
            </div>
          ))
        )}
        <div className="flex flex-row justify-between mt-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!hasPrev || isBMIDataLoading}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext || isBMIDataLoading}>Next</Button>
        </div>
        <BMICalculatorDialog open={isDialogOpen} setOpen={setIsDialogOpen} initialWeight={weight} initialHeight={height} onAdd={handleAddBMI} isLoading={isAdding} addError={addError} />
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
                  Your ideal weight is <span className="font-medium">{((22 * (latest.height / 100) * (latest.height / 100)).toFixed(1))} kg</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function BMICalculatorDialog({ open, setOpen, initialWeight, initialHeight, onAdd, isLoading, addError }: { open: boolean, setOpen: (open: boolean) => void, initialWeight: number, initialHeight: number, onAdd: (data: { weight: number, height: number }) => void, isLoading?: boolean, addError?: string }) {
    const [weight, setWeight] = useState(initialWeight);
    const [height, setHeight] = useState(initialHeight);

    useEffect(() => {
      if (open) {
        setWeight(initialWeight);
        setHeight(initialHeight);
      }
    }, [open, initialWeight, initialHeight]);

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New BMI</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Weight</Label>
              <Input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Height</Label>
              <Input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
            </div>
            {addError && <div className="text-red-500 text-sm">{addError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={() => onAdd({ weight, height })} disabled={!weight || !height || isLoading}>{isLoading ? "Adding..." : "Add"}
              
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
}

