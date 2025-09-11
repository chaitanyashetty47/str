import { redirect } from "next/navigation";
import { PlanEditorProvider } from "@/contexts/PlanEditorContext";
import { CreatePlanMain } from "@/components/create-plan/create-plan-main";
import prisma from "@/utils/prisma/prismaClient";
import { requireTrainerAccess } from "@/utils/user";
import {
  PlanEditorState,
  WeekInPlan,
  DayInPlan,
  ExerciseInPlan,
  SetInPlan,
} from "@/types/workout-plans-create/editor-state";
import { v4 as uuidv4 } from "uuid";
import { IntensityMode, WeightUnit } from "@prisma/client";

export const metadata = {
  title: "Edit Workout Plan",
  description: "Modify workout plan details and structure",
};

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Enhanced authorization check
  try {
    // 1. Check if user is a fitness trainer (role-based authorization)
    const { userId: trainerId } = await requireTrainerAccess();
    
    // 2. Fetch plan with trainer ownership validation
    const plan = await prisma.workout_plans.findUnique({
      where: { 
        id,
        trainer_id: trainerId, // Only fetch if owned by authenticated trainer
      },
    include: {
      workout_days: {
        where: { is_deleted: false }, // Filter out soft-deleted days
        orderBy: [{ week_number: "asc" }, { day_number: "asc" }],
        include: {
          workout_day_exercises: {
            where: { is_deleted: false }, // Filter out soft-deleted exercises
            orderBy: { order: "asc" },
            include: {
              workout_exercise_lists: true,
              workout_set_instructions: {
                where: { is_deleted: false }, // Filter out soft-deleted sets
                orderBy: { set_number: "asc" },
              },
            },
          },
        },
      },
    },
  });

  // 3. Check if plan exists and trainer has access
  if (!plan) {
    redirect("/training/plans?error=Plan%20not%20found%20or%20access%20denied");
  }

  // 4. Fetch trainer's weight unit
  const trainer = await prisma.users_profile.findUnique({
    where: { id: trainerId },
    select: { weight_unit: true },
  });

  if (!trainer) {
    redirect("/unauthorized?reason=trainer_profile_missing");
  }

  // Convert DB shape to PlanEditorState
  const weeksMap = new Map<number, DayInPlan[]>();

  const blankDay = (weekNum: number, dayNum: 1 | 2 | 3 | 4 | 5 | 6 | 7): DayInPlan => ({
    dayNumber: dayNum,
    title: `Training Day ${dayNum}`,
    exercises: [],
    estimatedTimeMinutes: 0,
  });

  // Iterate over workout_days
  for (const dbDay of plan.workout_days) {
    const exercises: ExerciseInPlan[] = dbDay.workout_day_exercises.map((ex) => {
      const sets: SetInPlan[] = ex.workout_set_instructions.map((s) => ({
        setNumber: s.set_number,
        weight: s.weight_prescribed != null ? s.weight_prescribed.toString() : "",
        reps: s.reps != null ? s.reps.toString() : "",
        rest: s.rest_time ?? 0,
        notes: s.notes ?? "",
      }));

      return {
        uid: ex.frontend_uid || uuidv4(), // Use stored UID or generate new one
        listExerciseId: ex.list_exercise_id,
        name: ex.workout_exercise_lists.name,
        bodyPart: ex.workout_exercise_lists.type,
        thumbnail: ex.workout_exercise_lists.gif_url,
        isRepsBased: ex.workout_exercise_lists.is_reps_based, // NEW: Include reps-based flag
        order: ex.order ?? 0,
        instructions: ex.instructions ?? "",
        sets,
      };
    });

    const dayObj: DayInPlan = {
      dayNumber: dbDay.day_number as 1 | 2 | 3 | 4 | 5 | 6 | 7,
      title: dbDay.title,
      exercises,
      estimatedTimeMinutes: 0,
    };

    const arr = weeksMap.get(dbDay.week_number) ?? [];
    arr.push(dayObj);
    weeksMap.set(dbDay.week_number, arr);
  }

  // Build ordered weeks array with flexible day support
  const weeks: WeekInPlan[] = Array.from(weeksMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([weekNumber, daysArr]) => {
      // Sort days by day number
      const sortedDays = daysArr.sort((a, b) => a.dayNumber - b.dayNumber);
      
      // If no days exist, create default 3-day structure
      if (sortedDays.length === 0) {
        return {
          weekNumber,
          days: [
            blankDay(weekNumber, 1),
            blankDay(weekNumber, 2),
            blankDay(weekNumber, 3),
          ]
        };
      }
      
      // Use existing days as-is (supports 3-7 days)
      return { weekNumber, days: sortedDays };
    });

  const editorState: PlanEditorState = {
    meta: {
      title: plan.title,
      description: plan.description ?? "",
      startDate: plan.start_date,
      durationWeeks: plan.duration_in_weeks,
      category: plan.category,
      clientId: plan.client_id,
      intensityMode: plan.intensity_mode as IntensityMode,
      status: plan.status,
      weightUnit: trainer.weight_unit as WeightUnit,
    },
    weeks: weeks.length > 0 ? weeks : [{
      weekNumber: 1,
      days: [blankDay(1,1), blankDay(1,2), blankDay(1,3)]
    }],
    selectedWeek: 1,
    selectedDay: 1,
  };

  return (
    <PlanEditorProvider initial={editorState} trainerWeightUnit={trainer.weight_unit || WeightUnit.KG}>
      <CreatePlanMain mode="edit" planId={plan.id} />
    </PlanEditorProvider>
  );
  
  } catch (error) {
    // Handle authorization errors
    console.error("Edit plan authorization error:", error);
    
    // Check if it's an authentication/authorization error
    if (error instanceof Error) {
      if (error.message.includes("Authentication required")) {
        redirect("/sign-in?redirect=" + encodeURIComponent(`/training/plans/${id}`));
      } else if (error.message.includes("Fitness trainer access required")) {
        redirect("/unauthorized?reason=trainer_required");
      }
    }
    
    // Fallback for any other errors
    redirect("/unauthorized?reason=access_denied");
  }
}
