"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { deleteExercise, saveExercise } from "@/actions/workoutplan.action";
import { searchExercises } from "@/actions/exercise.action";
import { WorkoutExercise } from "@/types/workout.types";
import { Edit2Icon, Trash2Icon, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface ExerciseFormProps {
  planId: string;
  day: string;
  existingExercise?: WorkoutExercise;
  onSaved?: () => void;
  onDeleted?: () => void;
  onCancel?: () => void;
  embedded?: boolean;
}

interface ExerciseOption {
  id: string;
  name: string;
  youtube_link: string | null;
}

export default function ExerciseForm({
  planId,
  day,
  existingExercise,
  onSaved,
  onDeleted,
  onCancel,
  embedded = false,
}: ExerciseFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState(existingExercise?.name || "");
  const [selectedExerciseId, setSelectedExerciseId] = useState(existingExercise?.exercise_id || "");
  const [sets, setSets] = useState(existingExercise?.sets?.toString() || "3");
  const [weight, setWeight] = useState(existingExercise?.weight?.toString() || "80");
  const [reps, setReps] = useState(existingExercise?.reps?.toString() || "10");
  const [restTime, setRestTime] = useState(existingExercise?.rest_time || "");
  const [youtubeLink, setYoutubeLink] = useState(existingExercise?.youtube_link || "");
  const [notes, setNotes] = useState(existingExercise?.notes || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExerciseOption[]>([]);
  const [isExerciseDropdownOpen, setIsExerciseDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const collapsibleTriggerRef = useRef<HTMLButtonElement>(null);

  // Search for exercises when the search query changes
  useEffect(() => {
    const fetchExercises = async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const { data, error } = await searchExercises(searchQuery);
          if (data) {
            setSearchResults(data);
          }
        } catch (error) {
          console.error("Error searching exercises:", error);
        } finally {
          setIsSearching(false);
        }
      }
    };

    fetchExercises();
  }, [searchQuery]);

  const handleSelectExercise = (exercise: ExerciseOption) => {
    setSelectedExerciseId(exercise.id);
    console.log("exercise", exercise);
    setName(exercise.name);
    if (exercise.youtube_link) {
      setYoutubeLink(exercise.youtube_link);
    }
    setIsExerciseDropdownOpen(false);
  };

  const closeCollapsible = () => {
    setIsCollapsibleOpen(false);
    // Programmatically click the collapsible trigger to close it
    if (collapsibleTriggerRef.current) {
      collapsibleTriggerRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("planId", planId);
      formData.append("day", day);
      
      if (existingExercise?.id) {
        formData.append("exerciseId", existingExercise.id);
      }
      
      formData.append("name", name);
      formData.append("sets", sets);
      formData.append("reps", reps);
      formData.append("weight", weight);
      if (selectedExerciseId) {
        formData.append("exercise_id", selectedExerciseId);
      }
      
      if (restTime) formData.append("restTime", restTime);
      if (youtubeLink) formData.append("youtubeLink", youtubeLink);
      if (notes) formData.append("notes", notes);
      
      const result = await saveExercise(formData);
      
      if (result.error) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        setIsDialogOpen(false);
        if (embedded) {
          closeCollapsible();
        }
        
        // Show success toast
        toast({
          title: existingExercise ? "Exercise Updated" : "Exercise Added",
          description: `${name} has been ${existingExercise ? "updated" : "added"} to day ${day}.`,
          variant: "default",
        });
        
        if (onSaved) onSaved();
      }
    } catch (error) {
      console.error("Error saving exercise:", error);
      setError("An unexpected error occurred. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingExercise?.id) return;
    
    setIsDeleting(true);
    setError("");
    
    try {
      const result = await deleteExercise(existingExercise.id, planId);
      
      if (result.error) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        setIsAlertOpen(false);
        setIsDialogOpen(false);
        if (embedded) {
          closeCollapsible();
        }
        
        // Show delete success toast
        toast({
          title: "Exercise Deleted",
          description: `${existingExercise.name} has been removed from day ${day}.`,
          variant: "default",
        });
        
        if (onDeleted) onDeleted();
      }
    } catch (error) {
      console.error("Error deleting exercise:", error);
      setError("An unexpected error occurred. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while deleting the exercise.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEmbeddedCancel = () => {
    closeCollapsible();
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name">Exercise Name</Label>
        <Popover open={isExerciseDropdownOpen} onOpenChange={setIsExerciseDropdownOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isExerciseDropdownOpen}
              className="w-full justify-between font-normal bg-background col px-3 hover:bg-background focus-visible:border-ring focus-visible:outline-[3px] focus-visible:outline-ring/20"
            >
              <span className={cn("truncate", !name && "text-muted-foreground")}>
                {name || "Select an exercise..."}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-muted-foreground/80" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0" 
            align="start"
          >
            <Command>
              <CommandInput
                placeholder="Search exercises..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No exercises found.</CommandEmpty>
                <CommandGroup>
                  {searchResults.map((exercise) => (
                    <CommandItem
                      key={exercise.id}
                      value={exercise.name}
                      onSelect={() => {
                        handleSelectExercise(exercise);
                      }}
                    >
                      {exercise.name}
                      {selectedExerciseId === exercise.id && (
                        <Check size={16} strokeWidth={2} className="ml-auto" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
       
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sets">Sets</Label>
          <Input
            id="sets"
            type="number"
            min="1"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reps">Reps</Label>
          <Input
            id="reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="e.g., 10 or 8-12"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g., 80-90 kgs"
            required
            
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="restTime">Rest Time (Optional)</Label>
        <Input
          id="restTime"
          value={restTime}
          onChange={(e) => setRestTime(e.target.value)}
          placeholder="e.g., 60 seconds"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="youtubeLink">YouTube Link (Optional)</Label>
        <Input
          id="youtubeLink"
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
          placeholder="https://youtube.com/..."
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional instructions or tips..."
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-2">
        {(onCancel || embedded) && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={embedded ? handleEmbeddedCancel : onCancel}
          >
            Cancel
          </Button>
        )}
        
        {existingExercise?.id && (
          <Button 
            type="button" 
            variant="destructive"
            onClick={() => setIsAlertOpen(true)}
          >
            Delete
          </Button>
        )}
        
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : existingExercise?.id ? "Update" : "Save"}
        </Button>
      </div>
    </form>
  );

  if (embedded && existingExercise) {
    return (
      <Collapsible open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen}>
        <div className="flex gap-2">
          <CollapsibleTrigger asChild>
            <Button ref={collapsibleTriggerRef} size="sm" variant="outline">
              <Edit2Icon className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={(e) => {
              e.stopPropagation();
              setIsAlertOpen(true);
            }}
          >
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
        
        <CollapsibleContent className="p-4 pt-0 border-t mt-4">
          <div className="flex justify-between items-center mb-4 pt-4">
            <h3 className="text-sm font-medium">Edit Exercise</h3>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleEmbeddedCancel} 
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          {formContent}
        </CollapsibleContent>
        
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the exercise "{existingExercise.name}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Collapsible>
    );
  }

  if (existingExercise) {
    return (
      <>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit2Icon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Exercise</DialogTitle>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the exercise "{existingExercise.name}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Exercise</CardTitle>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  );
} 