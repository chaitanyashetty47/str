"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAction } from "@/hooks/useAction";
import { invalidatePr, restorePr } from "@/actions/client-workout/invalidate-pr.action";
import { toast } from "sonner";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface PRInvalidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prId: string;
  exerciseName: string;
  isInvalidated?: boolean;
  onSuccess?: () => void;
}

export function PRInvalidationModal({
  isOpen,
  onClose,
  prId,
  exerciseName,
  isInvalidated = false,
  onSuccess,
}: PRInvalidationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    execute: invalidatePrAction,
    isLoading: isInvalidating,
  } = useAction(invalidatePr, {
    onSuccess: (data) => {
      setIsSubmitting(false);
      toast.success(data.message || "Personal record invalidated successfully");
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error || "Failed to invalidate personal record");
    },
  });

  const {
    execute: restorePrAction,
    isLoading: isRestoring,
  } = useAction(restorePr, {
    onSuccess: (data) => {
      setIsSubmitting(false);
      toast.success(data.message || "Personal record restored successfully");
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error || "Failed to restore personal record");
    },
  });

  const handleConfirm = async () => {
    setIsSubmitting(true);
    
    if (isInvalidated) {
      await restorePrAction({ prId });
    } else {
      await invalidatePrAction({ prId });
    }
  };

  const isLoading = isInvalidating || isRestoring || isSubmitting;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isInvalidated ? (
              <>
                <RotateCcw className="h-5 w-5 text-blue-600" />
                Restore Personal Record
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Invalidate Personal Record
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isInvalidated 
              ? `Are you sure you want to restore the personal record for "${exerciseName}"?`
              : `Are you sure you want to invalidate the personal record for "${exerciseName}"?`
            }
          </AlertDialogDescription>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-3">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ This action {isInvalidated ? "will restore" : "cannot be undone"}.
            </p>
            {!isInvalidated && (
              <p className="text-sm text-yellow-700 mt-1">
                The personal record will be hidden from your records and analytics.
              </p>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={isInvalidated ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}
          >
            {isLoading ? (
              "Processing..."
            ) : isInvalidated ? (
              "Restore Record"
            ) : (
              "Invalidate Record"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}