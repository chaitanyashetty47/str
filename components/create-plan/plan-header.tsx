"use client"

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkoutCategory, IntensityMode } from "@prisma/client";
import { useTrainerClientOptions } from "@/hooks/use-trainer-client-options";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { usePlanMeta, usePlanDispatch } from "@/contexts/PlanEditorContext";
import { Switch } from "@/components/ui/switch";
import { WorkoutPlanStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { createWorkoutPlan } from "@/actions/plans/create-workout-plan.action";
import { updateWorkoutPlan } from "@/actions/plans/update-workout-plan.action";
import { usePlanState } from "@/contexts/PlanEditorContext";
import { useAction } from "@/hooks/useAction";
import { archiveWorkoutPlan } from "@/actions/plans/archive-workout-plan.action";

interface PlanHeaderProps {
  mode: "create" | "edit" | "archive";
  trainerId?: string;
  planId?: string;
}

export function PlanHeader({ mode, trainerId, planId }: PlanHeaderProps) {
  const router = useRouter();
  const state = usePlanState();
  const { meta, toggleIntensity, setStatus } = usePlanMeta();
  const dispatch = usePlanDispatch();

  const startMonday = startOfWeek(meta.startDate, { weekStartsOn: 1 });
  const endDate = addDays(startMonday, meta.durationWeeks * 7 - 1);

  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) return;
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    dispatch({ type: "UPDATE_META", payload: { startDate: monday } });
  };

  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  const { options: clientOptions, isLoading: isClientsLoading } = useTrainerClientOptions();

  const filteredClientOptions = clientOptions.filter((opt) =>
    opt.name.toLowerCase().includes(clientSearchQuery.toLowerCase()),
  );

  const selectedClient = clientOptions.find((opt) => opt.id === meta.clientId);

  // Setup useAction based on mode
  const createAction = useAction(createWorkoutPlan, {
    onSuccess: ({ id }) => router.push(`/training/plans/${id}`),
    onError: (error) => {
      console.error("Error creating plan:", error);
    },
  });

  const updateAction = useAction(updateWorkoutPlan, {
    onSuccess: () => router.refresh(),
    onError: (error) => {
      console.error("Error updating plan:", error);
    },
  });

  const archiveAction = useAction(archiveWorkoutPlan, {
    onSuccess: () => router.refresh(),
  });

  const handleSave = async () => {
    if (mode === "create" && trainerId) {
      await createAction.execute({ trainerId, meta: state.meta, weeks: state.weeks });
    } else if (mode === "edit" && planId) {
      await updateAction.execute({ id: planId, meta: state.meta, weeks: state.weeks });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      
      <Label>Plan Name</Label>
      <Input 
      type="text" 
      placeholder="Enter plan name" 
      value={meta.title}
      onChange={(e) => dispatch({ type: "UPDATE_META", payload: { title: e.target.value } })}
      />
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
              variant="outline" 
              className={cn( "w-full justify-start text-left font-normal",
                !meta.startDate && "text-muted-foreground"
              )}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {meta.startDate? format(meta.startDate, "PPP") : "Select a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={meta.startDate} onSelect={handleStartDateChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Duration(in weeks)</Label>
          <Input
          type="number"
          readOnly
          value={meta.durationWeeks}
          onChange={(e) => dispatch({ type: "UPDATE_META", payload: { durationWeeks: parseInt(e.target.value) } })}
          /> 
        </div>
        <div className="flex flex-col gap-2">
          <Label>End Date</Label>
          <Label className="text-sm text-muted-foreground">
            {endDate? format(endDate, "PPP") : "Select a date"}
          </Label>
          
        </div>
        <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
            value={meta.category}
            onValueChange={(value) => dispatch({ type: "UPDATE_META", payload: { category: value as WorkoutCategory } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
                {/* what should be default value */}
                
              </SelectTrigger>
              <SelectContent>
                {Object.values(WorkoutCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.split("_").join(" ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <div className="flex flex-col gap-2">
            <Label>Select a client</Label>
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
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isClientDropdownOpen}
                    className="w-full justify-between font-normal bg-background"
                  >
                    <span className={cn("truncate", !selectedClient && "text-muted-foreground")}> 
                      {selectedClient ? selectedClient.name : "Select a client..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground/80" />
                  </Button>
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
                              dispatch({ type: "UPDATE_META", payload: { clientId: client.id } });
                              setIsClientDropdownOpen(false);
                            }}
                          >
                            {client.name}
                            {client.id === meta.clientId && (
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
        </div>
      </div>
      <Label>Description</Label>
      <Textarea
        value={meta.description}
        onChange={(e) => dispatch({ type: "UPDATE_META", payload: { description: e.target.value } })}
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
          !meta.description && "text-muted-foreground"
        )}
        rows={4}
      />

      {/* Intensity toggle & status buttons */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4">
        {/* Toggle */}
        <div className="flex items-center gap-2">
          <Label className="text-xs">ABS</Label>
          <Switch
            checked={meta.intensityMode === IntensityMode.PERCENT}
            onCheckedChange={() => toggleIntensity()}
          />
          <Label className="text-xs">1-RM&nbsp;%</Label>
        </div>

        {/* Status buttons */}
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            size="sm"
            variant={meta.status === WorkoutPlanStatus.DRAFT ? "default" : "outline"}
            onClick={() => {
              setStatus(WorkoutPlanStatus.DRAFT);
              console.log("Draft button clicked");
              handleSave();
            }}
            disabled={createAction.isLoading || updateAction.isLoading}
          >
            {mode === "create" ? "Save Draft" : "Update Draft"}
          </Button>
          <Button
            size="sm"
            variant={meta.status === WorkoutPlanStatus.PUBLISHED ? "default" : "secondary"}
            onClick={() => {
              setStatus(WorkoutPlanStatus.PUBLISHED);
              console.log("Published button clicked");
              handleSave();
            }}
            disabled={createAction.isLoading || updateAction.isLoading}
          >
            {mode === "create" ? "Publish" : "Republish"}
          </Button>
          {mode === "edit" && (
            <Button
              size="sm"
              variant="destructive"
              disabled={archiveAction.isLoading || createAction.isLoading || updateAction.isLoading}
              onClick={() => {
                archiveAction.execute({ id: planId!, archive: meta.status !== WorkoutPlanStatus.ARCHIVED });
              }}
            >
              {meta.status === WorkoutPlanStatus.ARCHIVED ? "Unarchive" : "Archive"}
            </Button>
          )}
        </div>
      </div>

    </div>
  );
  }