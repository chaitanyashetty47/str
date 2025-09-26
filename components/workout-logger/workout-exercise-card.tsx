"use client";

import { useState } from "react";
import { Play, Info, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { type WorkoutExercise } from "@/actions/client-workout/client-weekly-workout.action";
import  YoutubeModal  from "@/components/client-workout-page/youtube-modal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner";

interface WorkoutExerciseCardProps {
  exercise: WorkoutExercise;
  onSaveSet: (
    dayExerciseId: string,
    setNumber: number,
    weightKg: number,
    reps: number,
    rpe?: number
  ) => void;
  isSaving: boolean;
  isPastDeadline?: boolean;
  deadlineDate?: string;
}

interface SetInputs {
  [setNumber: number]: {
    weight: string;
    reps: string;
    rpe: string;
  };
}

export function WorkoutExerciseCard({ exercise, onSaveSet, isSaving, isPastDeadline = false, deadlineDate }: WorkoutExerciseCardProps) {
  const [setInputs, setSetInputs] = useState<SetInputs>({});
  const [editingSets, setEditingSets] = useState<Set<number>>(new Set());
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSave, setPendingSave] = useState<{
    setNumber: number;
    weightKg: number;
    reps: number;
    rpe?: number;
    modalType?: 'typo' | 'extreme' | 'high' | 'moderate';
  } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  const [rpePopups, setRpePopups] = useState<{[key:number]: boolean}>({});

  const updateSetInput = (setNumber: number, field: 'weight' | 'reps' | 'rpe', value: string) => {
    setSetInputs(prev => {
      const current = prev[setNumber] ?? { weight: '', reps: '', rpe: '' };
      return {
        ...prev,
        [setNumber]: {
          ...current,
          [field]: value,
        },
      };
    });

    // Clear validation errors when user starts typing
    const errorKey = `${setNumber}-${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }

    // Validate RPE on the fly
    if (field === 'rpe' && value) {
      const rpeValue = parseInt(value);
      if (!isNaN(rpeValue) && (rpeValue < 1 || rpeValue > 10)) {
        setValidationErrors(prev => ({
          ...prev,
          [errorKey]: 'RPE must be between 1 and 10'
        }));

        // Show popup only when value > 10 (too high)
        if (rpeValue > 10) {
          // toast.error('RPE must be between 1 and 10', { duration: 5000 });

          // show bubble popup near input
          setRpePopups(prev => ({ ...prev, [setNumber]: true }));
          // hide after 5s
          setTimeout(() => {
            setRpePopups(prev => ({ ...prev, [setNumber]: false }));
          }, 5000);
        }
      }
    }
  };

  const handleSaveSet = (setNumber: number) => {
    const inputs = setInputs[setNumber];
    if (!inputs?.reps) return;
    
    // For reps-based exercises, weight is not required
    if (!exercise.isRepsBased && !inputs?.weight) return;

    const weightKg = exercise.isRepsBased ? 0 : parseFloat(inputs.weight);
    const reps = parseInt(inputs.reps);
    const rpe = inputs.rpe ? parseInt(inputs.rpe) : undefined;

    // Validate required fields
    if (isNaN(reps) || reps < 0) return;
    if (!exercise.isRepsBased && (isNaN(weightKg) || weightKg < 0)) return;
    
    // Check for RPE validation errors
    if (validationErrors[`${setNumber}-rpe`]) {
      // Don't save if there are validation errors, but allow user to continue editing
      return;
    }
    
    // Validate RPE if provided
    if (rpe !== undefined && (isNaN(rpe) || rpe < 1 || rpe > 10)) return;

    // Find the target set for comparison
    const targetSet = exercise.sets.find(s => s.setNumber === setNumber);
    if (!targetSet) return;

    // Calculate ratios for smart detection
    const weightRatio = weightKg / targetSet.targetWeight;
    const repsRatio = reps / targetSet.targetReps;

    // ORM Protection Logic - catch values that could affect personal records
    if (weightRatio >= 10 || repsRatio >= 10) {
      // Obvious typos
      setPendingSave({ setNumber, weightKg, reps, rpe, modalType: 'typo' });
      setShowConfirmDialog(true);
      return;
    } else if ((repsRatio >= 3 && weightRatio <= 0.5) || (weightRatio >= 3 && repsRatio <= 0.5)) {
      // Extreme values that could skew personal records
      setPendingSave({ setNumber, weightKg, reps, rpe, modalType: 'extreme' });
      setShowConfirmDialog(true);
      return;
    } else if (weightRatio >= 2 && repsRatio >= 2) {
      // Both significantly higher
      setPendingSave({ setNumber, weightKg, reps, rpe, modalType: 'high' });
      setShowConfirmDialog(true);
      return;
    } else if (weightRatio >= 1.3 || repsRatio >= 1.3) {
      // Moderate increase
      setPendingSave({ setNumber, weightKg, reps, rpe, modalType: 'moderate' });
      setShowConfirmDialog(true);
      return;
    }

    // Proceed with save
    performSave(setNumber, weightKg, reps, rpe);
  };

  const performSave = (setNumber: number, weightKg: number, reps: number, rpe?: number) => {
    onSaveSet(exercise.dayExerciseId, setNumber, weightKg, reps, rpe);

    // Clear inputs after save
    setSetInputs(prev => ({
      ...prev,
      [setNumber]: { weight: '', reps: '', rpe: '' },
    }));
    
    // Stop editing this set
    setEditingSets(prev => {
      const newSet = new Set(prev);
      newSet.delete(setNumber);
      return newSet;
    });
  };

  const handleConfirmSave = () => {
    if (pendingSave) {
      performSave(pendingSave.setNumber, pendingSave.weightKg, pendingSave.reps, pendingSave.rpe);
      setPendingSave(null);
    }
    setShowConfirmDialog(false);
  };

  const handleCancelSave = () => {
    setPendingSave(null);
    setShowConfirmDialog(false);
  };

  const handleEditSet = (setNumber: number, set: any) => {
    // Pre-populate inputs with current logged values
    setSetInputs(prev => ({
      ...prev,
      [setNumber]: {
        weight: set.loggedWeight?.toString() || '',
        reps: set.loggedReps?.toString() || '',
        rpe: set.loggedRpe?.toString() || '',
      },
    }));
    
    // Add to editing sets
    setEditingSets(prev => new Set([...prev, setNumber]));
  };

  const handleCancelEdit = (setNumber: number) => {
    // Clear inputs
    setSetInputs(prev => ({
      ...prev,
      [setNumber]: { weight: '', reps: '', rpe: '' },
    }));
    
    // Remove from editing sets
    setEditingSets(prev => {
      const newSet = new Set(prev);
      newSet.delete(setNumber);
      return newSet;
    });
  };

  const getSetInputs = (setNumber: number) => {
    return setInputs[setNumber] || { weight: '', reps: '', rpe: '' };
  };

  return (
    <div className="space-y-4">
      {/* Exercise Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {exercise.bodyPart}
          </Badge>
          {exercise.isRepsBased && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              🏃 Reps-based
            </Badge>
          )}
          {exercise.instructions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstructions(!showInstructions)}
              className="h-6 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md"
              title="View trainer notes"
            >
              <Info className="h-3 w-3" />
            </Button>
          )}
          {exercise.youtubeLink && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowYoutube(true)}
              className="h-6 px-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              title="Watch YouTube tutorial"
            >
              <Play className="h-3 w-3 fill-white" />
            </Button>
          )}
        </div>
        <span className="text-sm text-gray-600">
          {exercise.completedSets} / {exercise.totalSets} sets
        </span>
      </div>

      {/* Instructions */}
      {exercise.instructions && (
        <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
          <CollapsibleContent className="bg-gray-50 rounded-lg p-3 text-sm">
            {exercise.instructions}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Sets Table */}
      <div className="space-y-2">
        <div className={`grid gap-2 text-xs font-medium text-gray-600 px-2 ${exercise.isRepsBased ? 'grid-cols-5' : 'grid-cols-6'}`}>
          <span>Set</span>
          {!exercise.isRepsBased && <span>Weight (kg)</span>}
          <span>Reps</span>
          {/* Add info icon and Tooltip content */}
          <span className="inline-flex items-center gap-1">RPE <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The Rate of Perceived Exertion (RPE) scale is a 1–10 rating system that helps measure how hard exercise feels based on effort</p>
                    <div className="text-sm text-gray-600">
                      <p className="text-blue-400">1-3: Warm-up, no burn &#40;Very Easy&#41;</p>
                      <p className="text-cyan-400">4-6: Light pump, could go much further &#40;Easy&#41;</p>
                      <p className="text-strentor-green">7-8: Strong pump, muscles working hard, can push another 2-3 reps &#40;Moderate&#41;</p>
                      <p className="text-strentor-orange">9: Near failure, strong burn, can push another rep &#40;Hard&#41;</p>
                      <p className="text-strentor-red">10: Absolute failure, can&apos;t complete another rep &#40;Very Hard&#41;</p>
                    </div>
                  </TooltipContent>
                </Tooltip></span>
          <span>Target</span>
          <span>Action</span>
        </div>

        {exercise.sets.map((set) => {
          const inputs = getSetInputs(set.setNumber);
          const isCompleted = set.isCompleted;
          const isEditing = editingSets.has(set.setNumber);
          const hasInputs = inputs.reps || (!exercise.isRepsBased && inputs.weight);

          return (
            <div
              key={set.setNumber}
              className={`grid gap-2 items-center p-2 rounded-lg border ${
                exercise.isRepsBased ? 'grid-cols-5' : 'grid-cols-6'
              } ${
                isCompleted && !isEditing
                  ? 'bg-green-50 border-green-200' 
                  : hasInputs || isEditing
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Set Number */}
              <span className="text-sm font-medium">
                {set.setNumber}
              </span>

              {/* Weight Input - Hidden for reps-based exercises */}
              {!exercise.isRepsBased && (
                <Input
                  type="number"
                  placeholder={isCompleted ? set.loggedWeight?.toString() : set.targetWeight.toString()}
                  value={inputs.weight ?? ''}
                  onChange={(e) => updateSetInput(set.setNumber, 'weight', e.target.value)}
                  disabled={(isCompleted && !isEditing) || isPastDeadline}
                  className={`h-8 text-sm ${validationErrors[`${set.setNumber}-weight`] ? 'border-red-500' : ''}`}
                  step="0.5"
                  min="0"
                />
              )}

              {/* Reps Input */}
              <Input
                type="number"
                placeholder={isCompleted ? set.loggedReps?.toString() : set.targetReps.toString()}
                value={inputs.reps ?? ''}
                onChange={(e) => updateSetInput(set.setNumber, 'reps', e.target.value)}
                disabled={(isCompleted && !isEditing) || isPastDeadline}
                className={`h-8 text-sm ${validationErrors[`${set.setNumber}-reps`] ? 'border-red-500' : ''}`}
                min="0"
              />

              {/* RPE Input */}
              <div className="relative ">
                <Input
                  type="number"
                  placeholder={isCompleted ? set.loggedRpe?.toString() : set.targetRpe?.toString() || ''}
                  value={inputs.rpe ?? ''}
                  onChange={(e) => updateSetInput(set.setNumber, 'rpe', e.target.value)}
                  disabled={(isCompleted && !isEditing) || isPastDeadline}
                  className={`h-8 text-sm ${validationErrors[`${set.setNumber}-rpe`] ? 'border-red-500' : ''}`}
                  min="1"
                  max="10"
                />
                {/* Inline error */}
                {validationErrors[`${set.setNumber}-rpe`] && (
                   <div className="absolute top-9 left-0 text-xs text-red-500 bg-white px-1 rounded shadow-sm border border-red-200">
                     {validationErrors[`${set.setNumber}-rpe`]}
                   </div>
                 )}

                 {/* Bubble popup */}
                 {rpePopups[set.setNumber] && (
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-md animate-bounce">
                     RPE must be ≤ 10
                   </div>
                 )}
              </div>

              {/* Target Display */}
              <div className="text-xs text-gray-600">
                <div>
                  {exercise.isRepsBased 
                    ? `${set.targetReps} reps` 
                    : `${set.targetWeight}kg × ${set.targetReps}`
                  }
                </div>
                {set.targetRpe && <div>RPE {set.targetRpe}</div>}
              </div>

              {/* Action Button */}
              {isCompleted && !isEditing ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditSet(set.setNumber, set)}
                  disabled={isPastDeadline}
                  className="h-8 px-2 bg-strentor-red hover:bg-strentor-red/80 text-white"
                  title={isPastDeadline ? `Logging deadline passed (${deadlineDate})` : undefined}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              ) : isEditing ? (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => handleSaveSet(set.setNumber)}
                    disabled={(!inputs.weight && !exercise.isRepsBased) || !inputs.reps || isSaving || !!validationErrors[`${set.setNumber}-rpe`] || isPastDeadline}
                    className={`h-8 px-2 bg-strentor-red hover:bg-strentor-red/80 text-white ${validationErrors[`${set.setNumber}-rpe`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isPastDeadline ? `Logging deadline passed (${deadlineDate})` : undefined}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCancelEdit(set.setNumber)}
                    className="h-8 px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleSaveSet(set.setNumber)}
                  disabled={(!inputs.weight && !exercise.isRepsBased) || !inputs.reps || isSaving || !!validationErrors[`${set.setNumber}-rpe`] || isPastDeadline}
                  className={`h-8 px-2 bg-strentor-red hover:bg-strentor-red/80 text-white ${validationErrors[`${set.setNumber}-rpe`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isPastDeadline ? `Logging deadline passed (${deadlineDate})` : undefined}
                >
                  Log
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Rest Time Info */}
      {exercise.sets.length > 0 && exercise.sets[0].restTime > 0 && (
        <div className="text-xs text-gray-600 px-2">
          Rest: {exercise.sets[0].restTime}s between sets
        </div>
      )}

      {/* YouTube Modal */}
      {exercise.youtubeLink && (
        <YoutubeModal
          isOpen={showYoutube}
          onClose={() => setShowYoutube(false)}
          videoUrl={exercise.youtubeLink}
          exerciseName={exercise.name}
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingSave?.modalType === 'typo' && '🚨 Possible Typo Detected!'}
              {pendingSave?.modalType === 'extreme' && '⚠️ Unusual Values Detected'}
              {pendingSave?.modalType === 'high' && '⚠️ High Values Detected'}
              {pendingSave?.modalType === 'moderate' && '✅ Good Progress!'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSave?.modalType === 'typo' && 'This looks like a typo. Did you mean to enter these values?'}
              {pendingSave?.modalType === 'extreme' && 'These values are quite different from prescribed. Please double-check before logging.'}
              {pendingSave?.modalType === 'high' && 'These values are significantly higher than prescribed. Are you sure?'}
              {pendingSave?.modalType === 'moderate' && 'Nice increase! Confirm to log these values.'}
            </AlertDialogDescription>
            {pendingSave && (
              <div className={`p-3 rounded-lg space-y-1 mt-3 ${
                pendingSave.modalType === 'typo' ? 'bg-red-50 border border-red-200' :
                pendingSave.modalType === 'extreme' ? 'bg-orange-50 border border-orange-200' :
                pendingSave.modalType === 'high' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-green-50 border border-green-200'
              }`}>
                <div className="font-medium text-sm mb-2">
                  You entered: {pendingSave.weightKg}kg × {pendingSave.reps} reps
                </div>
                <div className="text-sm text-gray-600">
                  Prescribed: {exercise.sets.find(s => s.setNumber === pendingSave.setNumber)?.targetWeight}kg × {exercise.sets.find(s => s.setNumber === pendingSave.setNumber)?.targetReps} reps
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSave}>
              Cancel & Edit
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              {pendingSave?.modalType === 'typo' && 'Yes, These Are Correct'}
              {pendingSave?.modalType === 'extreme' && 'Yes, Log These Values'}
              {pendingSave?.modalType === 'high' && 'Yes, Log These Values'}
              {pendingSave?.modalType === 'moderate' && 'Confirm & Log'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 