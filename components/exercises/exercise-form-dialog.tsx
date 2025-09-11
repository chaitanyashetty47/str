"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExercise } from "@/actions/exercise_list/create-exercise.action";
import { updateExercise } from "@/actions/exercise_list/update-exxercise.action";
import { Exercise } from "./exercises-page";
import { BodyPart } from "@prisma/client";
import { toast } from "sonner";

interface ExerciseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exercise?: Exercise | null;
  mode: "create" | "edit";
}

const exerciseFormSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  type: z.nativeEnum(BodyPart, { required_error: "Body part is required" }),
  is_reps_based: z.boolean().default(false),
  youtube_link: z.string().optional(),
});

type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

const BODY_PART_OPTIONS = [
  { value: "CHEST", label: "Chest" },
  { value: "BACK", label: "Back" },
  { value: "SHOULDERS", label: "Shoulders" },
  { value: "BICEPS", label: "Biceps" },
  { value: "TRICEPS", label: "Triceps" },
  { value: "LEGS", label: "Legs" },
  { value: "CORE", label: "Core" },
  { value: "CARDIO", label: "Cardio" },
  { value: "FULL_BODY", label: "Full Body" },
];

export function ExerciseFormDialog({ isOpen, onClose, exercise, mode }: ExerciseFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: "",
      type: "CHEST",
      is_reps_based: false,
      youtube_link: "",
    },
  });

  // Reset form when dialog opens/closes or exercise changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && exercise) {
        form.reset({
          name: exercise.name,
          type: exercise.type,
          is_reps_based: exercise.is_reps_based,
          youtube_link: exercise.youtube_link || "",
        });
      } else {
        form.reset({
          name: "",
          type: "CHEST",
          is_reps_based: false,
          youtube_link: "",
        });
      }
    }
  }, [isOpen, mode, exercise, form]);

  const onSubmit = async (data: ExerciseFormData) => {
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (mode === "create") {
        result = await createExercise(data);
      } else {
        result = await updateExercise({
          exerciseId: exercise!.id,
          ...data,
        });
      }

      if (result.data) {
        toast.success(result.data.message);
        onClose();
        // The table will automatically refresh due to the useEffect dependency
      } else {
        toast.error(result.error || "Failed to save exercise");
      }
    } catch (error) {
      console.error("Error saving exercise:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Exercise" : "Edit Exercise"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Add a new exercise to the library." 
              : "Update the exercise details."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter exercise name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Part</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select body part" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BODY_PART_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_reps_based"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Reps-based Exercise</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check if this exercise is bodyweight-based (pushups, pull-ups, etc.)
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="youtube_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Link (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://www.youtube.com/watch?v=..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (mode === "create" ? "Creating..." : "Updating...") 
                  : (mode === "create" ? "Create Exercise" : "Update Exercise")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}