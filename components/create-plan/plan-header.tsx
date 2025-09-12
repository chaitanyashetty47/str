"use client"

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkoutCategory, IntensityMode } from "@prisma/client";
import { useTrainerClientOptions } from "@/hooks/use-trainer-client-options";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePlanMeta, usePlanDispatch, usePlanValidation } from "@/contexts/PlanEditorContext";
import { WorkoutPlanStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { createWorkoutPlan } from "@/actions/plans/create-workout-plan.action";
import { updateWorkoutPlan } from "@/actions/plans/update-workout-plan.action";
import { usePlanState } from "@/contexts/PlanEditorContext";
import { useAction } from "@/hooks/useAction";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { PlanHeaderSchema, type PlanHeaderFormData, validatePlanHeader } from "@/lib/schemas/plan-validation";
import { format, addDays, startOfWeek } from "date-fns";

interface PlanHeaderProps {
  mode: "create" | "edit" | "archive";
  trainerId?: string;
  planId?: string;
}

export function PlanHeader({ mode, trainerId, planId }: PlanHeaderProps) {
  const router = useRouter();
  const state = usePlanState();
  
  const { meta, setStatus } = usePlanMeta();
  const dispatch = usePlanDispatch();
  const { validateAllSets, hasValidationErrors } = usePlanValidation();

  const startMonday = startOfWeek(meta.startDate, { weekStartsOn: 1 });
  const endDate = addDays(startMonday, meta.durationWeeks * 7 - 1);

  // Initialize React Hook Form with validation
  const form = useForm<PlanHeaderFormData>({
    resolver: zodResolver(PlanHeaderSchema),
    mode: "onTouched", // Validate on blur, then on change
    values: {
      title: meta.title,
      description: meta.description,
      startDate: meta.startDate,
      durationWeeks: meta.durationWeeks,
      category: meta.category,
      clientId: meta.clientId,
      intensityMode: meta.intensityMode,
      status: meta.status,
    },
  });

  const { handleSubmit, setValue, watch, formState: { errors, isValid, isSubmitting } } = form;

  // Get current form values for client selection display
  const formValues = watch();

  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return;
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    setValue("startDate", monday, { shouldValidate: true });
    dispatch({ 
      type: "UPDATE_META", 
      payload: { ...meta, startDate: monday } 
    });
    
    // Clear conflict error when date changes
    setConflictError(null);
  };

  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [invalidClientError, setInvalidClientError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const { options: clientOptions, isLoading: isClientsLoading } = useTrainerClientOptions();

  // Check if the pre-selected clientId exists in the trainer's client list
  const selectedClient = clientOptions.find((opt) => opt.id === formValues.clientId);
  const preSelectedClientExists = meta.clientId && selectedClient;

  // Show error if pre-selected client doesn't exist
  useEffect(() => {
    if (meta.clientId && !selectedClient && clientOptions.length > 0) {
      setInvalidClientError("Selected client doesn't exist or doesn't belong to you");
      // Reset the clientId to empty to show placeholder
      setValue("clientId", "");
      dispatch({ 
        type: "UPDATE_META", 
        payload: { ...meta, clientId: "" } 
      });
    } else {
      setInvalidClientError(null);
    }
  }, [meta.clientId, selectedClient, clientOptions.length, setValue, dispatch, meta]);

  const filteredClientOptions = clientOptions.filter((opt) =>
    opt.name.toLowerCase().includes(clientSearchQuery.toLowerCase()),
  );

  const handleClientSelect = (clientId: string) => {
    const client = clientOptions.find((opt) => opt.id === clientId);
    if (client) {
      setValue("clientId", clientId);
      dispatch({ 
        type: "UPDATE_META", 
        payload: { ...meta, clientId: clientId } 
      });
      setInvalidClientError(null);
      setIsClientDropdownOpen(false); // Close the dropdown
    } else {
      setInvalidClientError("Selected client doesn't exist or doesn't belong to you");
      setValue("clientId", ""); // Clear the input
      dispatch({ 
        type: "UPDATE_META", 
        payload: { ...meta, clientId: "" } 
      });
    }
  };

  // Setup useAction based on mode
  const createAction = useAction(createWorkoutPlan, {
    onSuccess: ({ id }) => {
      setConflictError(null); // Clear any previous conflict errors
      toast.success("Workout plan created successfully!");
      router.push(`/training/plans/${id}`);
    },
    onError: (error) => {
      console.error("Error creating plan:", error);
      
      // Check if it's a conflict error (contains specific keywords)
      if (error.includes("Choose start date after") && error.includes("currently published")) {
        setConflictError(error);
        toast.error("Plan date conflict detected");
      } else {
        setConflictError(null);
        toast.error("Failed to create workout plan. Please try again.");
      }
    },
  });

  const updateAction = useAction(updateWorkoutPlan, {
    onSuccess: () => {
      setConflictError(null); // Clear any previous conflict errors
      toast.success("Workout plan updated successfully!");
      router.refresh();
    },
    onError: (error) => {
      console.error("Error updating plan:", error);
      
      // Check if it's a conflict error (contains specific keywords)
      if (error.includes("Choose start date after") && error.includes("currently published")) {
        setConflictError(error);
        toast.error("Plan date conflict detected");
      } else {
        setConflictError(null);
        toast.error("Failed to update workout plan. Please try again.");
      }
    },
  });

  // Validated form submission
  const onValidatedSubmit = async (validatedData: PlanHeaderFormData) => {
    // Validate exercise sets before submission
    const exerciseValidation = validateAllSets();
    
    if (!exerciseValidation.isValid) {
      const errorCount = exerciseValidation.totalErrors;
      const exerciseCount = exerciseValidation.exerciseErrors.length;
      
      toast.error(
        `Please fix ${errorCount} validation error${errorCount !== 1 ? 's' : ''} in ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} before saving.`,
        {
          description: "All exercise sets must have reps and rest time filled.",
          duration: 5000,
        }
      );
      return; // Stop submission
    }

    // Show loading toast
    const loadingToast = toast.loading(
      mode === "create" ? "Creating workout plan..." : "Updating workout plan..."
    );

    try {
      // Update the context state with validated data
      dispatch({ 
        type: "UPDATE_META", 
        payload: {
          ...validatedData,
          // Ensure startDate is set to Monday
          startDate: startOfWeek(validatedData.startDate, { weekStartsOn: 1 })
        }
      });

      // Execute the action with the current state (will be updated by the time this runs)
      if (mode === "create" && trainerId) {
        await createAction.execute({ 
          trainerId, 
          meta: { ...state.meta, ...validatedData }, 
          weeks: state.weeks 
        });
      } else if (mode === "edit" && planId) {
        await updateAction.execute({ 
          id: planId, 
          meta: { ...state.meta, ...validatedData }, 
          weeks: state.weeks 
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      toast.dismiss(loadingToast);
    }
  };

  // Handle form submission with validation
  const handleValidatedSave = async (status: WorkoutPlanStatus) => {
    // Update status in form
    setValue("status", status, { shouldValidate: true });
    setStatus(status);

    // Trigger form validation and submission
    await handleSubmit(onValidatedSubmit)();
  };

  return (
    <FormProvider {...form}>
      <form className="flex flex-col gap-4">
        
        {/* Plan Name Field */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan Name</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  placeholder="Enter plan name" 
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      <div className="grid grid-cols-3 gap-4">
        {/* Start Date Field */}
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onSelect={handleStartDateChange}
                  placeholder="Select start date"
                  className="w-full"
                  allowFutureDates={true}
                />
              </FormControl>
              <FormMessage />
              {conflictError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTitle>Plan Conflict</AlertTitle>
                  <AlertDescription className="text-sm">
                    {conflictError}
                  </AlertDescription>
                </Alert>
              )}
            </FormItem>
          )}
        />
        {/* Duration Field */}
        <FormField
          control={form.control}
          name="durationWeeks"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Duration (in weeks)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  readOnly
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* End Date (Read-only calculated field) */}
        <div className="flex flex-col gap-2">
          <Label>End Date</Label>
          <Input
            type="date"
            value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
            disabled
            className="w-full"
          />
        </div>
        {/* Category Field */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(WorkoutCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.split("_").join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Client Selection Field */}
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <FormLabel>Select a client</FormLabel>
              {invalidClientError && (
                <Alert variant="destructive" className="mb-2">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{invalidClientError}</AlertDescription>
                </Alert>
              )}
              {isClientsLoading ? (
                <Button variant="outline" className="w-full justify-between" disabled>
                  Loading clients...
                </Button>
              ) : clientOptions.length === 0 ? (
                <Alert className="w-full">
                  <AlertTitle>No clients found</AlertTitle>
                  <AlertDescription>
                    You have no assigned clients. Add a client before creating a plan.
                  </AlertDescription>
                </Alert>
              ) : (
                <Popover open={isClientDropdownOpen} onOpenChange={setIsClientDropdownOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isClientDropdownOpen}
                        className="w-full justify-between font-normal bg-background"
                      >
                        <span className={cn("truncate", !selectedClient && "text-muted-foreground")}> 
                          {selectedClient ? selectedClient.name : "Choose a client"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground/80" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0" align="start">
                    <Command>
                      {clientOptions.length > 10 && (
                        <CommandInput
                          placeholder="Search clients..."
                          value={clientSearchQuery}
                          onValueChange={setClientSearchQuery}
                        />
                      )}
                      <CommandList>
                        <CommandEmpty>No clients found.</CommandEmpty>
                        <CommandGroup>
                          {(clientOptions.length > 10 ? filteredClientOptions : clientOptions).map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.name}
                              onSelect={() => {
                                handleClientSelect(client.id);
                              }}
                            >
                              {client.name}
                              {client.id === field.value && (
                                <Check size={16} strokeWidth={2} className="ml-auto" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Description Field */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Enter plan description"
                className={cn(
                  "resize-none",                      // disable manual resizing
                  "rounded-2xl",                      // more circular corners
                  "p-4",                              // increase padding for size
                  "h-40",                             // custom height (can be changed)
                  "focus-visible:outline-none",       // remove default blue outline
                  "focus-visible:ring-2",             // enable ring
                  "focus-visible:ring-black",         // black ring color
                  "focus-visible:ring-offset-2",      // spacing around the ring
                  !field.value && "text-muted-foreground"
                )}
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Status and Action Buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4">
        
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge 
            variant={meta.status === WorkoutPlanStatus.PUBLISHED ? "default" : "secondary"}
            className={cn(
              meta.status === WorkoutPlanStatus.PUBLISHED 
                ? "bg-green-100 text-green-800 hover:bg-green-200" 
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            )}
          >
            {meta.status === WorkoutPlanStatus.PUBLISHED ? "Published" : "Draft"}
          </Badge>
        </div>

        {/* Action Buttons */}
        <TooltipProvider>
          <div className="flex gap-2 w-full md:w-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => handleValidatedSave(WorkoutPlanStatus.DRAFT)}
                  disabled={createAction.isLoading || updateAction.isLoading || isSubmitting}
                >
                  Save Draft
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save changes without publishing to client</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  type="button"
                  variant="default"
                  onClick={() => handleValidatedSave(WorkoutPlanStatus.PUBLISHED)}
                  disabled={createAction.isLoading || updateAction.isLoading || isSubmitting}
                >
                  {mode === "create" 
                    ? "Publish Plan" 
                    : meta.status === WorkoutPlanStatus.PUBLISHED 
                      ? "Update Published Plan" 
                      : "Publish Plan"
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {mode === "create" 
                    ? "Make plan available to client" 
                    : meta.status === WorkoutPlanStatus.PUBLISHED 
                      ? "Update the published plan for client" 
                      : "Make plan available to client"
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      </form>
    </FormProvider>
  );
}