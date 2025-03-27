"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { createExercise } from "@/actions/exercise.action";
import { useToast } from "@/components/ui/use-toast";
import { useFormStatus } from "react-dom";

interface AddExerciseButtonProps {
  label: string;
}

// Submit Button with loading state
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding..." : "Add Exercise"}
    </Button>
  );
}

export function AddExerciseButton({ label }: AddExerciseButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  async function handleFormAction(formData: FormData) {
    const { data, error } = await createExercise(formData);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Exercise added successfully"
      });
      setOpen(false);
      setName("");
      setYoutubeLink("");
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={handleFormAction}>
          <DialogHeader>
            <DialogTitle>Add New Exercise</DialogTitle>
            <DialogDescription>
              Create a new exercise to use in your workout plans.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="font-medium">
                Exercise Name *
              </Label>
              <Input
                id="name"
                name="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Barbell Bench Press"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="youtube_link" className="font-medium">
                YouTube Link (Optional)
              </Label>
              <Input
                id="youtube_link"
                name="youtube_link"
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                placeholder="e.g., https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 