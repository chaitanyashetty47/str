import { redirect } from "next/navigation";
import { PlanEditorProvider } from "@/contexts/PlanEditorContext";
import { CreatePlanMain } from "@/components/create-plan/create-plan-main";
import prisma from "@/utils/prisma/prismaClient";
import { createClient } from "@/utils/supabase/server";
import {
  PlanEditorState,
  WeekInPlan,
  DayInPlan,
  ExerciseInPlan,
  SetInPlan,
} from "@/types/workout-plans-create/editor-state";
import { v4 as uuidv4 } from "uuid";
import { IntensityMode } from "@prisma/client";

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

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/sign-in");

  // Fetch plan with full nested structure via Prisma
  const plan = await prisma.workout_plans.findUnique({
    where: { id },
    include: {
      workout_days: {
        orderBy: [{ week_number: "asc" }, { day_number: "asc" }],
        include: {
          workout_day_exercises: {
            orderBy: { order: "asc" },
            include: {
              workout_exercise_lists: true,
              workout_set_instructions: {
                orderBy: { set_number: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!plan || plan.trainer_id !== user.id) {
    redirect("/training/plans?error=Plan%20not%20found");
  }

  // Convert DB shape to PlanEditorState
  const weeksMap = new Map<number, DayInPlan[]>();

  const blankDay = (weekNum: number, dayNum: 1 | 2 | 3): DayInPlan => ({
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
        uid: uuidv4(), // generate new UID for client editing
        listExerciseId: ex.list_exercise_id,
        name: ex.workout_exercise_lists.name,
        bodyPart: ex.workout_exercise_lists.type,
        thumbnail: ex.workout_exercise_lists.gif_url,
        order: ex.order ?? 0,
        instructions: ex.instructions ?? "",
        sets,
      };
    });

    const dayObj: DayInPlan = {
      dayNumber: dbDay.day_number as 1 | 2 | 3,
      title: dbDay.title,
      exercises,
      estimatedTimeMinutes: 0,
    };

    const arr = weeksMap.get(dbDay.week_number) ?? [];
    arr.push(dayObj);
    weeksMap.set(dbDay.week_number, arr);
  }

  // Build ordered weeks array
  const weeks: WeekInPlan[] = Array.from(weeksMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([weekNumber, daysArr]) => {
      const days: [DayInPlan, DayInPlan, DayInPlan] = [
        blankDay(weekNumber, 1),
        blankDay(weekNumber, 2),
        blankDay(weekNumber, 3),
      ];
      for (const d of daysArr) {
        days[d.dayNumber - 1] = d; // replace blank
      }
      return { weekNumber, days };
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
    },
    weeks: weeks.length > 0 ? weeks : [{
      weekNumber: 1,
      days: [blankDay(1,1), blankDay(1,2), blankDay(1,3)]
    }],
    selectedWeek: 1,
    selectedDay: 1,
  };

  return (
    <PlanEditorProvider initial={editorState}>
      <CreatePlanMain mode="edit" planId={plan.id} />
    </PlanEditorProvider>
  );
}
