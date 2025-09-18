"use server";

import { z } from "zod";
import { createSafeAction, ActionState } from "@/lib/create-safe-action";
import prisma from "@/utils/prisma/prismaClient";
import { createClient } from "@/utils/supabase/server";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
export interface SavedSetData {
  logId: string;
  setId: string;
  dayExerciseId: string; // NEW: Add dayExerciseId for proper matching
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number;
  logDate: string;
  isCompleted: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// Save Workout Set Action
// ────────────────────────────────────────────────────────────────────────────
const saveSetInput = z.object({
  dayExerciseId: z.string().uuid(),
  setNumber: z.number().min(1).max(20),
  weightKg: z.number().min(0).max(1000), // Always in kg
  reps: z.number().min(0).max(100),
  rpe: z.number().min(1).max(10).optional(),
  logDate: z.string(), // Simple date string like "2025-06-29"
});

async function saveSetHandler({ 
  dayExerciseId, 
  setNumber, 
  weightKg, 
  reps, 
  rpe,
  logDate 
}: z.infer<typeof saveSetInput>): Promise<ActionState<z.infer<typeof saveSetInput>, SavedSetData>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  try {
    // Find the specific set instruction for this exercise and set number
    const setInstruction = await prisma.workout_set_instructions.findFirst({
      where: {
        exercise_id: dayExerciseId,
        set_number: setNumber,
      },
      include: {
        workout_day_exercises: {
          include: {
            workout_days: {
              include: {
                workout_plans: true,
              },
            },
          },
        },
      },
    });

    if (!setInstruction) {
      return { error: "Set instruction not found" };
    }

    // Verify user owns this workout plan
    if (setInstruction.workout_day_exercises.workout_days.workout_plans.client_id !== userId) {
      return { error: "Access denied" };
    }

    // Check if log already exists for this set (one row per set policy)
    // We now use set_id + client_id as the unique identifier, ignoring dates
    const existingLog = await prisma.exercise_logs.findFirst({
      where: {
        set_id: setInstruction.id,
        client_id: userId,
      },
    });

    let savedLog;

    // Get the scheduled date from the workout day
    const workoutDay = setInstruction.workout_day_exercises.workout_days;
    const scheduledDate = new Date(workoutDay.day_date);
    const performedDate = new Date(); // Current date when user logs

      if (existingLog) {
        // Update existing log - keep scheduled_date, update performed_date
        savedLog = await prisma.exercise_logs.update({
          where: { id: existingLog.id },
          data: {
            weight_used: weightKg,
            reps_done: reps,
            rpe: rpe,
            performed_date: performedDate, // Update when it was actually performed
            // scheduled_date stays the same
          },
        });
        
        // PR RECALCULATION FOR UPDATES -------------------------------------------
        const exerciseId = setInstruction.workout_day_exercises.list_exercise_id;
        
        // Get exercise info to check if it's reps-based
        const exerciseInfo = await prisma.workout_exercise_lists.findUnique({
          where: { id: exerciseId },
          select: { is_reps_based: true },
        });

        // Check if this set was previously linked to a PR
        const existingPrLinkedToSet = await prisma.client_max_lifts.findFirst({
          where: {
            client_id: userId,
            list_exercise_id: exerciseId,
            set_id: savedLog.id,
            is_invalid: false,
          },
        });

        // Get current best PR (excluding invalid ones and this set's PR)
        const currentPr = await prisma.client_max_lifts.findFirst({
          where: {
            client_id: userId,
            list_exercise_id: exerciseId,
            is_invalid: false,
            NOT: existingPrLinkedToSet ? { id: existingPrLinkedToSet.id } : undefined,
          },
          orderBy: exerciseInfo?.is_reps_based ? { max_reps: "desc" } : { max_weight: "desc" },
        });

        if (exerciseInfo?.is_reps_based) {
          // For reps-based exercises
          const isNewPr = !currentPr || reps > (currentPr.max_reps || 0);
          
          if (existingPrLinkedToSet) {
            if (isNewPr) {
              // Update existing PR
              await prisma.client_max_lifts.update({
                where: { id: existingPrLinkedToSet.id },
                data: {
                  max_reps: reps,
                  last_updated: new Date(),
                  date_achieved: scheduledDate,
                },
              });
            } else {
              // This set is no longer a PR, invalidate the linked PR
              await prisma.client_max_lifts.update({
                where: { id: existingPrLinkedToSet.id },
                data: { is_invalid: true },
              });
            }
          } else if (isNewPr) {
            // Create new PR linked to this set
            // const { randomUUID } = await import('crypto');
            await prisma.client_max_lifts.create({
              data: {
                // id: randomUUID(),
                client_id: userId,
                list_exercise_id: exerciseId,
                max_reps: reps,
                exercise_type: "REPS_BASED",
                last_updated: new Date(),
                date_achieved: scheduledDate,
                set_id: savedLog.id,
                is_invalid: false,
              },
            });
          }
        } else {
          // For weight-based exercises
          const cappedReps = Math.min(reps, 12);
          const estimatedOneRm = Math.round(weightKg * (1 + cappedReps / 30));
          const isNewPr = !currentPr || estimatedOneRm > (currentPr.max_weight || 0);
          
          if (existingPrLinkedToSet) {
            if (isNewPr) {
              // Update existing PR
              await prisma.client_max_lifts.update({
                where: { id: existingPrLinkedToSet.id },
                data: {
                  max_weight: estimatedOneRm,
                  last_updated: new Date(),
                  date_achieved: scheduledDate,
                },
              });
            } else {
              // This set is no longer a PR, invalidate the linked PR
              await prisma.client_max_lifts.update({
                where: { id: existingPrLinkedToSet.id },
                data: { is_invalid: true },
              });
            }
          } else if (isNewPr) {
            // Create new PR linked to this set
            // const { randomUUID } = await import('crypto');
            await prisma.client_max_lifts.create({
              data: {
                // id: randomUUID(),
                client_id: userId,
                list_exercise_id: exerciseId,
                max_weight: estimatedOneRm,
                exercise_type: "WEIGHT_BASED",
                last_updated: new Date(),
                date_achieved: scheduledDate,
                set_id: savedLog.id,
                is_invalid: false,
              },
            });
          }
        }
      } else {
      // Create new log - generate UUID for id
      // const { randomUUID } = await import('crypto');
      savedLog = await prisma.exercise_logs.create({
        data: {
          // id: randomUUID(),
          client_id: userId,
          set_id: setInstruction.id,
          weight_used: weightKg,
          reps_done: reps,
          rpe: rpe,
          scheduled_date: scheduledDate, // When it was scheduled
          performed_date: performedDate, // When it was actually performed
        },
      });
      
      // PR TRACKING -----------------------------------------------------------
      const exerciseId = setInstruction.workout_day_exercises.list_exercise_id;
      
      // Get exercise info to check if it's reps-based
      const exerciseInfo = await prisma.workout_exercise_lists.findUnique({
        where: { id: exerciseId },
        select: { is_reps_based: true },
      });

      // Check if this set was previously linked to a PR (for updates)
      const existingPrLinkedToSet = await prisma.client_max_lifts.findFirst({
        where: {
          client_id: userId,
          list_exercise_id: exerciseId,
          set_id: savedLog.id,
          is_invalid: false,
        },
      });

      // Get current best PR (excluding invalid ones)
      const currentPr = await prisma.client_max_lifts.findFirst({
        where: {
          client_id: userId,
          list_exercise_id: exerciseId,
          is_invalid: false,
        },
        orderBy: exerciseInfo?.is_reps_based ? { max_reps: "desc" } : { max_weight: "desc" },
      });

      if (exerciseInfo?.is_reps_based) {
        // For reps-based exercises, track max reps achieved
        const isNewPr = !currentPr || reps > (currentPr.max_reps || 0);
        
        if (existingPrLinkedToSet) {
          // Update existing PR linked to this set
          await prisma.client_max_lifts.update({
            where: { id: existingPrLinkedToSet.id },
            data: {
              max_reps: reps,
              last_updated: new Date(),
              date_achieved: scheduledDate,
            },
          });
        } else if (isNewPr) {
          // Create new PR linked to this set
          await prisma.client_max_lifts.create({
            data: {
              // id: randomUUID(),
              client_id: userId,
              list_exercise_id: exerciseId,
              max_reps: reps,
              exercise_type: "REPS_BASED",
              last_updated: new Date(),
              date_achieved: scheduledDate,
              set_id: savedLog.id, // NEW: Link to specific set
              is_invalid: false,
            },
          });
        }
      } else {
        // For weight-based exercises, calculate estimated 1-RM using Epley formula capped at 12 reps
        const cappedReps = Math.min(reps, 12);
        const estimatedOneRm = Math.round(weightKg * (1 + cappedReps / 30));
        const isNewPr = !currentPr || estimatedOneRm > (currentPr.max_weight || 0);
        
        if (existingPrLinkedToSet) {
          // Update existing PR linked to this set
          await prisma.client_max_lifts.update({
            where: { id: existingPrLinkedToSet.id },
            data: {
              max_weight: estimatedOneRm,
              last_updated: new Date(),
              date_achieved: scheduledDate,
            },
          });
        } else if (isNewPr) {
          // Create new PR linked to this set
          await prisma.client_max_lifts.create({
            data: {
              // id: randomUUID(),
              client_id: userId,
              list_exercise_id: exerciseId,
              max_weight: estimatedOneRm,
              exercise_type: "WEIGHT_BASED",
              last_updated: new Date(),
              date_achieved: scheduledDate,
              set_id: savedLog.id, // NEW: Link to specific set
              is_invalid: false,
            },
          });
        }
      }
    }

    const result: SavedSetData = {
      logId: savedLog.id,
      setId: setInstruction.id,
      dayExerciseId: setInstruction.exercise_id, // NEW: Include dayExerciseId
      setNumber,
      weightKg,
      reps,
      rpe,
      logDate,
      isCompleted: true,
    };

    return { data: result };

  } catch (error) {
    console.error("Error saving workout set:", error);
    return { error: "Failed to save workout set" };
  }
}

export const saveWorkoutSet = createSafeAction<
  z.infer<typeof saveSetInput>,
  SavedSetData
>(saveSetInput, saveSetHandler);

// ────────────────────────────────────────────────────────────────────────────
// Delete Workout Set Action (for unsaving/clearing a set)
// ────────────────────────────────────────────────────────────────────────────
const deleteSetInput = z.object({
  dayExerciseId: z.string().uuid(),
  setNumber: z.number().min(1).max(20),
  logDate: z.string(), // Simple date string like "2025-06-29"
});

async function deleteSetHandler({ 
  dayExerciseId, 
  setNumber, 
  logDate 
}: z.infer<typeof deleteSetInput>): Promise<ActionState<z.infer<typeof deleteSetInput>, { success: boolean }>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  try {
    // Find the specific set instruction
    const setInstruction = await prisma.workout_set_instructions.findFirst({
      where: {
        exercise_id: dayExerciseId,
        set_number: setNumber,
      },
      include: {
        workout_day_exercises: {
          include: {
            workout_days: {
              include: {
                workout_plans: true,
              },
            },
          },
        },
      },
    });

    if (!setInstruction) {
      return { error: "Set instruction not found" };
    }

    // Verify user owns this workout plan
    if (setInstruction.workout_day_exercises.workout_days.workout_plans.client_id !== userId) {
      return { error: "Access denied" };
    }

    // Delete the exercise log (one row per set policy)
    await prisma.exercise_logs.deleteMany({
      where: {
        set_id: setInstruction.id,
        client_id: userId,
      },
    });

    return { data: { success: true } };

  } catch (error) {
    console.error("Error deleting workout set:", error);
    return { error: "Failed to delete workout set" };
  }
}

export const deleteWorkoutSet = createSafeAction<
  z.infer<typeof deleteSetInput>,
  { success: boolean }
>(deleteSetInput, deleteSetHandler);

// ────────────────────────────────────────────────────────────────────────────
// Bulk Save Exercise Action (for saving all sets of an exercise at once)
// ────────────────────────────────────────────────────────────────────────────
const bulkSaveExerciseInput = z.object({
  dayExerciseId: z.string().uuid(),
  logDate: z.string(), // Simple date string like "2025-06-29"
  sets: z.array(z.object({
    setNumber: z.number().min(1).max(20),
    weightKg: z.number().min(0).max(1000),
    reps: z.number().min(0).max(100),
    rpe: z.number().min(1).max(10).optional(),
  })),
});

async function bulkSaveExerciseHandler({ 
  dayExerciseId, 
  logDate, 
  sets 
}: z.infer<typeof bulkSaveExerciseInput>): Promise<ActionState<z.infer<typeof bulkSaveExerciseInput>, SavedSetData[]>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { error: "User not authenticated" };
  }

  try {
    // Verify user owns this workout day exercise
    const dayExercise = await prisma.workout_day_exercises.findFirst({
      where: { 
        id: dayExerciseId,
        workout_days: {
          workout_plans: {
            client_id: userId
          }
        }
      },
      include: {
        workout_set_instructions: {
          orderBy: { set_number: "asc" },
        },
      },
    });

    if (!dayExercise) {
      return { error: "Exercise not found or access denied" };
    }

    // Save all sets in a transaction
    const results: SavedSetData[] = [];

    for (const set of sets) {
      const setInstruction = dayExercise.workout_set_instructions.find(
        s => s.set_number === set.setNumber
      );

      if (!setInstruction) {
        continue; // Skip if set instruction not found
      }

      // Check if log already exists (one row per set policy)
      const existingLog = await prisma.exercise_logs.findFirst({
        where: {
          set_id: setInstruction.id,
          client_id: userId,
        },
      });

      let savedLog;

      // Get the scheduled date from the workout day (we need to fetch it)
      const workoutDay = await prisma.workout_days.findFirst({
        where: {
          workout_day_exercises: {
            some: {
              id: dayExerciseId
            }
          }
        }
      });

      if (!workoutDay) {
        continue; // Skip if we can't find the workout day
      }

      const scheduledDate = new Date(workoutDay.day_date);
      const performedDate = new Date(); // Current date when user logs

      if (existingLog) {
        savedLog = await prisma.exercise_logs.update({
          where: { id: existingLog.id },
          data: {
            weight_used: set.weightKg,
            reps_done: set.reps,
            rpe: set.rpe,
            performed_date: performedDate, // Update when it was actually performed
            // scheduled_date stays the same
          },
        });
        
        // PR RECALCULATION FOR UPDATES (BULK) -----------------------------------
        const exerciseId = dayExercise.list_exercise_id;
        
        // Get exercise info to check if it's reps-based
        const exerciseInfo = await prisma.workout_exercise_lists.findUnique({
          where: { id: exerciseId },
          select: { is_reps_based: true },
        });

        // Check if this set was previously linked to a PR
        const existingPrLinkedToSet = await prisma.client_max_lifts.findFirst({
          where: {
            client_id: userId,
            list_exercise_id: exerciseId,
            set_id: savedLog.id,
            is_invalid: false,
          },
        });

        // Get current best PR (excluding invalid ones and this set's PR)
        const currentPr = await prisma.client_max_lifts.findFirst({
          where: {
            client_id: userId,
            list_exercise_id: exerciseId,
            is_invalid: false,
            NOT: existingPrLinkedToSet ? { id: existingPrLinkedToSet.id } : undefined,
          },
          orderBy: exerciseInfo?.is_reps_based ? { max_reps: "desc" } : { max_weight: "desc" },
        });

        if (exerciseInfo?.is_reps_based) {
          // For reps-based exercises
          const isNewPr = !currentPr || set.reps > (currentPr.max_reps || 0);
          
          if (existingPrLinkedToSet) {
            if (isNewPr) {
              // Update existing PR
              await prisma.client_max_lifts.update({
                where: { id: existingPrLinkedToSet.id },
                data: {
                  max_reps: set.reps,
                  last_updated: new Date(),
                  date_achieved: scheduledDate,
                },
              });
            } else {
              // This set is no longer a PR, invalidate the linked PR
              await prisma.client_max_lifts.update({
                where: { id: existingPrLinkedToSet.id },
                data: { is_invalid: true },
              });
            }
          } else if (isNewPr) {
            // Create new PR linked to this set
            // const { randomUUID } = await import('crypto');
            await prisma.client_max_lifts.create({
              data: {
                // id: randomUUID(),
                client_id: userId,
                list_exercise_id: exerciseId,
                max_reps: set.reps,
                exercise_type: "REPS_BASED",
                last_updated: new Date(),
                date_achieved: scheduledDate,
                set_id: savedLog.id,
                is_invalid: false,
              },
            });
          }
        } else {
          // For weight-based exercises
          const cappedReps = Math.min(set.reps, 12);
          const estimatedOneRm = Math.round(set.weightKg * (1 + cappedReps / 30));
          const isNewPr = !currentPr || estimatedOneRm > (currentPr.max_weight || 0);
          
          if (existingPrLinkedToSet) {
            if (isNewPr) {
              // Update existing PR
              await prisma.client_max_lifts.update({
                where: { id: existingPrLinkedToSet.id },
                data: {
                  max_weight: estimatedOneRm,
                  last_updated: new Date(),
                  date_achieved: scheduledDate,
                },
              });
            } else {
              // This set is no longer a PR, invalidate the linked PR
              await prisma.client_max_lifts.update({
                where: { id: existingPrLinkedToSet.id },
                data: { is_invalid: true },
              });
            }
          } else if (isNewPr) {
            // Create new PR linked to this set
            // const { randomUUID } = await import('crypto');
            await prisma.client_max_lifts.create({
              data: {
                // id: randomUUID(),
                client_id: userId,
                list_exercise_id: exerciseId,
                max_weight: estimatedOneRm,
                exercise_type: "WEIGHT_BASED",
                last_updated: new Date(),
                date_achieved: scheduledDate,
                set_id: savedLog.id,
                is_invalid: false,
              },
            });
          }
        }
      } else {
        // const { randomUUID } = await import('crypto');
        savedLog = await prisma.exercise_logs.create({
          data: {
            // id: randomUUID(),
            client_id: userId,
            set_id: setInstruction.id,
            weight_used: set.weightKg,
            reps_done: set.reps,
            rpe: set.rpe,
            scheduled_date: scheduledDate, // When it was scheduled
            performed_date: performedDate, // When it was actually performed
          },
        });
        
        // PR TRACKING -----------------------------------------------------------
        const exerciseId = dayExercise.list_exercise_id;
        
        // Get exercise info to check if it's reps-based
        const exerciseInfo = await prisma.workout_exercise_lists.findUnique({
          where: { id: exerciseId },
          select: { is_reps_based: true },
        });

        // Check if this set was previously linked to a PR (for updates)
        const existingPrLinkedToSet = await prisma.client_max_lifts.findFirst({
          where: {
            client_id: userId,
            list_exercise_id: exerciseId,
            set_id: savedLog.id,
            is_invalid: false,
          },
        });

        // Get current best PR (excluding invalid ones)
        const currentPr = await prisma.client_max_lifts.findFirst({
          where: {
            client_id: userId,
            list_exercise_id: exerciseId,
            is_invalid: false,
          },
          orderBy: exerciseInfo?.is_reps_based ? { max_reps: "desc" } : { max_weight: "desc" },
        });

        if (exerciseInfo?.is_reps_based) {
          // For reps-based exercises, track max reps achieved
          const isNewPr = !currentPr || set.reps > (currentPr.max_reps || 0);
          
          if (existingPrLinkedToSet) {
            // Update existing PR linked to this set
            await prisma.client_max_lifts.update({
              where: { id: existingPrLinkedToSet.id },
              data: {
                max_reps: set.reps,
                last_updated: new Date(),
                date_achieved: scheduledDate,
              },
            });
          } else if (isNewPr) {
            // Create new PR linked to this set
            await prisma.client_max_lifts.create({
              data: {
                // id: randomUUID(),
                client_id: userId,
                list_exercise_id: exerciseId,
                max_reps: set.reps,
                exercise_type: "REPS_BASED",
                last_updated: new Date(),
                date_achieved: scheduledDate,
                set_id: savedLog.id, // NEW: Link to specific set
                is_invalid: false,
              },
            });
          }
        } else {
          // For weight-based exercises, calculate estimated 1-RM using Epley formula capped at 12 reps
          const cappedReps = Math.min(set.reps, 12);
          const estimatedOneRm = Math.round(set.weightKg * (1 + cappedReps / 30));
          const isNewPr = !currentPr || estimatedOneRm > (currentPr.max_weight || 0);
          
          if (existingPrLinkedToSet) {
            // Update existing PR linked to this set
            await prisma.client_max_lifts.update({
              where: { id: existingPrLinkedToSet.id },
              data: {
                max_weight: estimatedOneRm,
                last_updated: new Date(),
                date_achieved: scheduledDate,
              },
            });
          } else if (isNewPr) {
            // Create new PR linked to this set
            await prisma.client_max_lifts.create({
              data: {
                // id: randomUUID(),
                client_id: userId,
                list_exercise_id: exerciseId,
                max_weight: estimatedOneRm,
                exercise_type: "WEIGHT_BASED",
                last_updated: new Date(),
                date_achieved: scheduledDate,
                set_id: savedLog.id, // NEW: Link to specific set
                is_invalid: false,
              },
            });
          }
        }
      }

      results.push({
        logId: savedLog.id,
        setId: setInstruction.id,
        dayExerciseId: setInstruction.exercise_id, // NEW: Include dayExerciseId
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        rpe: set.rpe,
        logDate,
        isCompleted: true,
      });
    }

    return { data: results };

  } catch (error) {
    console.error("Error bulk saving exercise:", error);
    return { error: "Failed to save exercise sets" };
  }
}

export const bulkSaveExercise = createSafeAction<
  z.infer<typeof bulkSaveExerciseInput>,
  SavedSetData[]
>(bulkSaveExerciseInput, bulkSaveExerciseHandler); 