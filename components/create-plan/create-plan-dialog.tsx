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

  // Calculate end date based on duration weeks
  useEffect(() => {
    if (startDate && durationWeeks) {
      const newEndDate = new Date(startDate);
      newEndDate.setDate(newEndDate.getDate() + (parseInt(durationWeeks) * 7) - 1);
      setEndDate(newEndDate);
    }
  }, [startDate, durationWeeks]);

  const handleDurationChange = (value: string) => {
    setDurationWeeks(value);
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
    try {
      setIsSubmitting(true);
  
      const formData = new FormData(event.currentTarget); // Get form data
      formData.append("startDate", startDate.toISOString());
  
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
              <Select name="trainingDays" required>
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