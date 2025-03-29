"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { updatePlanAction } from "@/actions/workoutplan.action";
import { DatePicker } from "./date-picker";
import { useRouter } from "next/navigation";
import { TrainerClient } from "@/types/trainerclients.types";
import { WorkoutPlan } from "@/types/workout.types";
import { Pencil } from "lucide-react";
import { Database } from "@/utils/supabase/types";

// Import workout category enum
type WorkoutCategory = Database["public"]["Enums"]["workout_category"];

// Define workout categories for the dropdown
const WORKOUT_CATEGORIES: Record<WorkoutCategory, string> = {
  hypertrophy: "Hypertrophy",
  strength: "Strength",
  deload: "Deload",
  endurance: "Endurance"
};

interface EditPlanFormProps {
  plan: WorkoutPlan;
  trainerClients: TrainerClient[];
}

export function EditPlanForm({ plan, trainerClients }: EditPlanFormProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date>(
    plan.start_date ? new Date(plan.start_date) : new Date()
  );
  const [endDate, setEndDate] = useState<Date>(
    plan.end_date ? new Date(plan.end_date) : new Date()
  );
  const [durationWeeks, setDurationWeeks] = useState<string>(
    plan.duration_weeks ? plan.duration_weeks.toString() : "4"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Calculate end date based on duration weeks
  useEffect(() => {
    if (startDate && durationWeeks) {
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + (parseInt(durationWeeks) * 7));
      setEndDate(newEndDate);
    }
  }, [startDate, durationWeeks]);

  const handleDurationChange = (value: string) => {
    setDurationWeeks(value);
  };

  const daysOptions = [
    { value: "3", label: "3 Days" },
    { value: "4", label: "4 Days" },
    { value: "5", label: "5 Days" },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      
      const formData = new FormData(event.currentTarget);
      formData.append("startDate", startDate.toISOString());
      
      // The action will handle the redirect if successful
      await updatePlanAction(plan.id, formData);
      
      // If we're still here, ensure we reset the editing state
      setIsEditing(false);
      
      // The action may have redirected us, but if not, refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error updating plan:", error);
      // Ensure we reset editing state even on error
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
      // Final safety check to make sure editing mode is off
      setIsEditing(false);
    }
  };

  // Add a useEffect to update the UI when form is submitted
  useEffect(() => {
    if (!isSubmitting && !isEditing) {
      // This will ensure the form UI reflects the disabled state
      const inputElements = document.querySelectorAll('input, select, textarea');
      inputElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.blur();
        }
      });
    }
  }, [isSubmitting, isEditing]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Edit Plan</h2>
          <p className="text-muted-foreground">Update the details of your workout plan</p>
        </div>
        <Button 
          onClick={() => !isSubmitting && setIsEditing(!isEditing)} 
          variant="outline" 
          size="icon" 
          className={`h-10 w-10 rounded-full border-red-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 hover:text-red-600'}`}
          disabled={isSubmitting} 
          aria-label={isEditing ? "Cancel edit" : "Edit plan"}
        >
          <Pencil className={`h-5 w-5 ${isSubmitting ? 'text-gray-400' : 'text-red-600'}`} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className={isSubmitting ? 'opacity-70 pointer-events-none' : ''}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="planName">Plan Name</Label>
            <Input
              id="planName"
              name="planName"
              defaultValue={plan.name || ""}
              placeholder="e.g., Advanced Strength Training"
              required
              disabled={!isEditing}
              className="border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Select Client</Label>
            <Select name="clientId" defaultValue={plan.user_id} disabled={!isEditing}>
              <SelectTrigger className="border-2">
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

          <div className="space-y-2">
            <Label htmlFor="trainingDays">Training Days</Label>
            <Select name="trainingDays" defaultValue={plan.days?.toString()} disabled={!isEditing}>
              <SelectTrigger className="border-2">
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

          <div className="space-y-2">
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
              disabled={!isEditing}
              className="border-2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Workout Category</Label>
            <Select name="category" defaultValue={plan.category} disabled={!isEditing}>
              <SelectTrigger className="border-2">
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

          <div className="space-y-2">
            <Label>Start Date</Label>
            <DatePicker 
              date={startDate} 
              onSelect={(date) => date && setStartDate(date)} 
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label>End Date (calculated)</Label>
            <div className="flex h-10 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm">
              {format(endDate, "PPP")}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={plan.description || ""}
              placeholder="Brief description of the workout plan"
              className="h-32 border-2"
              required
              disabled={!isEditing}
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsEditing(false)} 
              className="mr-2"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-red-600 hover:bg-red-700 text-white min-w-[120px] relative"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block mr-2 animate-spin">⟳</span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
} 