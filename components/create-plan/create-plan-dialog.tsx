"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircleIcon } from "lucide-react";
import { createPlanAction } from "@/actions/workoutplan.action";
import { format, addDays, nextMonday } from "date-fns";
import { DatePicker } from "./date-picker";
import { useRouter } from "next/navigation";
import { Database } from "@/utils/supabase/types";
import { WorkoutFocusSelector } from "@/components/workout-focus-selector";

// Import workout category enum
type WorkoutCategory = Database["public"]["Enums"]["workout_category"];

// Define workout categories for the dropdown
const WORKOUT_CATEGORIES: Record<WorkoutCategory, string> = {
  hypertrophy: "Hypertrophy",
  strength: "Strength",
  deload: "Deload",
  endurance: "Endurance"
};

type WorkoutType = Database["public"]["Enums"]["workout_type"];

interface CreatePlanDialogProps {
  trainerClients: any[];
  label?: string;
}

export function CreatePlanDialog({ trainerClients, label = "Create New Plan" }: CreatePlanDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(nextMonday(new Date())); // Default to next Monday
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [durationWeeks, setDurationWeeks] = useState<string>("4");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trainingDaysCount, setTrainingDaysCount] = useState<number>(3);
  const [workoutFocuses, setWorkoutFocuses] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: boolean }>({});

  // Calculate end date based on duration weeks
  useEffect(() => {
    if (startDate && durationWeeks) {
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + (parseInt(durationWeeks) * 7) - 1);
      setEndDate(newEndDate);
    }
  }, [startDate, durationWeeks]);

  // Initialize workout focuses when training days changes
  useEffect(() => {
    setWorkoutFocuses(Array(trainingDaysCount).fill(""));
  }, [trainingDaysCount]);

  const handleDurationChange = (value: string) => {
    setDurationWeeks(value);
  };

  const handleTrainingDaysChange = (value: string) => {
    const count = parseInt(value);
    setTrainingDaysCount(count);
  };

  // Ensure that the selected date is always a Monday
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 1) {
      // If it's already Monday, use it directly
      setStartDate(date);
    } else {
      // Otherwise, find the next Monday
      const nextMondayDate = nextMonday(date);
      setStartDate(nextMondayDate);
    }
  };

  const daysOptions = [
    { value: "3", label: "3 Days" },
    { value: "4", label: "4 Days" },
    { value: "5", label: "5 Days" },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission

    // Validate workout focuses
    const newFormErrors: { [key: string]: boolean } = {};
    let hasErrors = false;
    
    // Check that each day has at least one focus area selected
    workoutFocuses.forEach((focus, index) => {
      if (!focus) {
        newFormErrors[`focus_${index}`] = true;
        hasErrors = true;
      }
    });
    
    setFormErrors(newFormErrors);
    
    if (hasErrors) {
      return; // Stop submission if validation fails
    }
    
    try {
      setIsSubmitting(true);
  
      const formData = new FormData(event.currentTarget); // Get form data
      formData.append("startDate", startDate.toISOString());
      
      // Add workout focuses to form data
      workoutFocuses.forEach((focus, index) => {
        formData.append(`workoutFocus_${index + 1}`, focus);
      });
  
      await createPlanAction(formData);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error creating plan:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6">
          <PlusCircleIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Workout Plan</DialogTitle>
          <DialogDescription>
            Design a structured workout program to assign to your clients
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="planName">Plan Name</Label>
              <Input
                id="planName"
                name="planName"
                placeholder="e.g., Advanced Strength Training"
                required
              />
            </div>

            <div>
              <Label htmlFor="client">Select Client</Label>
              <Select name="clientId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {trainerClients?.map((tc) => (
                    <SelectItem key={tc.client_id} value={tc.client_id}>
                      {tc.client?.name || tc.client?.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="trainingDays">Training Days</Label>
              <Select 
                name="trainingDays" 
                defaultValue="3"
                onValueChange={handleTrainingDaysChange}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select number of days" />
                </SelectTrigger>
                <SelectContent>
                  {daysOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                placeholder="e.g., 4"
                min="1"
                value={durationWeeks}
                onChange={(e) => handleDurationChange(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Workout Category</Label>
              <Select name="category" defaultValue="hypertrophy">
                <SelectTrigger>
                  <SelectValue placeholder="Select workout category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(WORKOUT_CATEGORIES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {trainingDaysCount > 0 && (
              <div className="space-y-4 rounded-md">
                <div>
                  <h3 className="font-medium text-lg">Workout Focus Areas</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Select the muscle groups to focus on for each training day
                  </p>
                </div>
                
                {Array.from({ length: trainingDaysCount }).map((_, index) => (
                  <WorkoutFocusSelector
                    key={`focus-${index}`}
                    dayNumber={index + 1}
                    value={workoutFocuses[index]}
                    error={formErrors[`focus_${index}`]}
                    onChange={(value) => {
                      const newFocuses = [...workoutFocuses];
                      newFocuses[index] = value;
                      setWorkoutFocuses(newFocuses);
                      
                      // Clear error when value is selected
                      if (value && formErrors[`focus_${index}`]) {
                        const newErrors = { ...formErrors };
                        delete newErrors[`focus_${index}`];
                        setFormErrors(newErrors);
                      }
                    }}
                  />
                ))}
              </div>
            )}

            <div>
              <Label>Start Date (Always Monday)</Label>
              <DatePicker 
                date={startDate} 
                onSelect={handleDateSelect}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The start date will automatically be adjusted to the next Monday if a different day is selected.
              </p>
            </div>

            <div>
              <Label>End Date (calculated)</Label>
              <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {format(endDate, "PPP")}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of the workout plan"
                className="h-32"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 