"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { deleteExercise, saveExercise } from "@/actions/workoutplan.action";
import { WorkoutExercise } from "@/types/workout.types";
import { Edit2Icon, Trash2Icon } from "lucide-react";
import { CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ExerciseFormProps {
  planId: string;
  day: string;
  existingExercise?: WorkoutExercise;
  onSaved?: () => void;
  onDeleted?: () => void;
  onCancel?: () => void;
  embedded?: boolean;
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
  const [name, setName] = useState(existingExercise?.name || "");
  const [sets, setSets] = useState(existingExercise?.sets?.toString() || "3");
  const [reps, setReps] = useState(existingExercise?.reps?.toString() || "10");
  const [restTime, setRestTime] = useState(existingExercise?.rest_time || "");
  const [youtubeLink, setYoutubeLink] = useState(existingExercise?.youtube_link || "");
  const [notes, setNotes] = useState(existingExercise?.notes || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

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
      
      if (restTime) formData.append("restTime", restTime);
      if (youtubeLink) formData.append("youtubeLink", youtubeLink);
      if (notes) formData.append("notes", notes);
      
      const result = await saveExercise(formData);
      
      if (result.error) {
        setError(result.error);
      } else {
        setIsDialogOpen(false);
        if (onSaved) onSaved();
      }
    } catch (error) {
      console.error("Error saving exercise:", error);
      setError("An unexpected error occurred. Please try again.");
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
      } else {
        setIsAlertOpen(false);
        setIsDialogOpen(false);
        if (onDeleted) onDeleted();
      }
    } catch (error) {
      console.error("Error deleting exercise:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
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
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Barbell Squat"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
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
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
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
      <>
        <CollapsibleTrigger asChild>
          <Button size="sm" variant="outline">
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
        
        <CollapsibleContent className="p-4 pt-0 border-t mt-4">
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
      </>
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