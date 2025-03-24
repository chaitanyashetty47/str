"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { encodedRedirect } from "@/utils/utils";
import { WorkoutPlan, WorkoutPlanFilters } from "@/types/workout.types";
import { TrainerClient } from "@/types/trainerclients.types";


export async function getWorkoutPlans(filters?: WorkoutPlanFilters) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized", data: null };
  }

  // Start building the query
  let query = supabase
    .from("workout_plans")
    .select(`
      id,
      name,
      category,
      days,
      duration_weeks,
      start_date,
      end_date,
      client:users!workout_plans_user_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq("trainer_id", user.id);

  // Apply filters if provided
  if (filters) {
    // Filter by client ID
    if (filters.clientId && filters.clientId !== 'all') {
      query = query.eq("user_id", filters.clientId);
    }

    // Filter by plan name search query
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      query = query.ilike("name", `%${filters.searchQuery}%`);
    }

    // Filter by plan status (active/previous based on date)
    if (filters.status) {
      // Get the current date at midnight to ensure consistent comparison
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const currentDate = now.toISOString();
      
      if (filters.status === 'active') {
        // Active plans: end_date is after or equal to today's date (midnight)
        query = query.gte("end_date", currentDate);
      } else if (filters.status === 'previous') {
        // Previous plans: end_date is strictly before today's date (midnight)
        query = query.lt("end_date", currentDate);
      }
    }
  }

  // Complete the query with sorting
  const { data, error: plansError } = await query.order("created_at", { ascending: false });

  if (plansError) {
    console.error("Error fetching plans:", plansError);
    return { error: plansError.message, data: null };
  }

  return { data: data as unknown as WorkoutPlan[], error: null };
}

export async function createPlanAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return encodedRedirect("error", "/sign-in", "Session expired");
  }

  const planName = formData.get("planName")?.toString();
  const clientId = formData.get("clientId")?.toString();
  const trainingDays = formData.get("trainingDays")?.toString();
  const duration = formData.get("duration")?.toString();
  const description = formData.get("description")?.toString();
  const startDateStr = formData.get("startDate")?.toString();

  if (!planName || !clientId || !trainingDays || !duration || !description) {
    return encodedRedirect(
      "error",
      "/training/plans/create",
      "All fields are required"
    );
  }

  // Use provided start date or default to now
  const now = startDateStr ? new Date(startDateStr) : new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + (parseInt(duration) * 7 - 1)); // duration weeks * 7 days - 1 (to account for start date)

  // Start a transaction to ensure plan and workout days are created together
  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .insert({
      name: planName,
      trainer_id: user.id,
      user_id: clientId,
      days: parseInt(trainingDays),
      duration_weeks: parseInt(duration),
      description: description,
      category: "hypertrophy", // Default category
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
    })
    .select()
    .single();

  if (planError) {
    console.error("Error creating plan:", planError);
    return encodedRedirect(
      "error",
      "/training/plans/create",
      "Failed to create workout plan"
    );
  }

  // Now create the workout days for this plan
  const workoutDays = [];
  const numDays = parseInt(trainingDays);
  
  // Define workout types based on number of days
  const workoutTypes: Record<number, Array<"legs" | "chest_triceps" | "back_biceps" | "full_body">> = {
    3: ["legs", "chest_triceps", "back_biceps"],
    4: ["legs", "chest_triceps", "back_biceps", "full_body"],
    5: ["legs", "chest_triceps", "back_biceps", "legs", "full_body"]
  };

  const types = workoutTypes[numDays] || Array(numDays).fill("full_body");
  
  for (let i = 0; i < numDays; i++) {
    workoutDays.push({
      plan_id: plan.id,
      day_number: i + 1,
      workout_type: types[i]
    });
  }
  
  const { error: daysError } = await supabase
    .from("workout_days")
    .insert(workoutDays);
    
  if (daysError) {
    console.error("Error creating workout days:", daysError);
    // We don't redirect here as the plan was created successfully
    // The workout days can be created later if needed
  }

  // Create workout plan weeks
  const durationWeeks = parseInt(duration);
  const planWeeks = [];
  
  for (let weekNum = 1; weekNum <= durationWeeks; weekNum++) {
    // Calculate week start (Monday) and end date (Sunday)
    const weekStartDate = new Date(now);
    // Add (weekNum - 1) weeks to the start date
    weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);
    
    const weekEndDate = new Date(weekStartDate);
    // End date is 6 days after start date (Sunday)
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    
    planWeeks.push({
      plan_id: plan.id,
      week_number: weekNum,
      start_date: weekStartDate.toISOString(),
      end_date: weekEndDate.toISOString(),
      status: "active" as "active" | "completed" | "pending" // Type assertion for Supabase enum
    });
  }
  
  if (planWeeks.length > 0) {
    const { error: weeksError } = await supabase
      .from("workout_plan_weeks")
      .insert(planWeeks);
      
    if (weeksError) {
      console.error("Error creating workout plan weeks:", weeksError);
      // We don't redirect here as the plan was created successfully
    }
  }

  return redirect(`/training/plans/${plan.id}`);
}

export async function getTrainerClients() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized", data: null };
  }

  const { data: trainerClients, error: clientsError } = await supabase
    .from("trainer_clients")
    .select(`
      client_id,
      client:users!trainer_clients_client_id_fkey (
        name,
        email
      )
    `)
    .eq("trainer_id", user.id);

  if (clientsError) {
    console.error("Error fetching clients:", clientsError);
    return { error: clientsError.message, data: null };
  }

  console.log("Raw data from query fer:", JSON.stringify(trainerClients, null, 2));

  return { data: trainerClients as unknown as TrainerClient[], error: null };
}

export async function getPlanById(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized", data: null };
  }

  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .select(`
      id,
      name,
      category,
      days,
      duration_weeks,
      description,
      start_date,
      end_date,
      user_id,
      client:users!workout_plans_user_id_fkey (
        name,
        email
      )
    `)
    .eq("id", id)
    .eq("trainer_id", user.id)
    .single();

  if (planError) {
    console.error("Error fetching plan:", planError);
    return { error: planError.message, data: null };
  }

  return { data: plan as unknown as WorkoutPlan, error: null };
}

export async function updatePlanAction(id: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return encodedRedirect("error", "/sign-in", "Session expired");
  }

  const planName = formData.get("planName")?.toString();
  const clientId = formData.get("clientId")?.toString();
  const trainingDays = formData.get("trainingDays")?.toString();
  const duration = formData.get("duration")?.toString();
  const description = formData.get("description")?.toString();
  const startDateStr = formData.get("startDate")?.toString();

  if (!planName || !clientId || !trainingDays || !duration || !description) {
    return encodedRedirect(
      "error",
      `/training/plans/${id}`,
      "All fields are required"
    );
  }

  // Fetch existing plan to check if days changed
  const { data: existingPlan } = await supabase
    .from("workout_plans")
    .select("days, duration_weeks, start_date")
    .eq("id", id)
    .eq("trainer_id", user.id)
    .single();

  if (!existingPlan) {
    return encodedRedirect(
      "error",
      `/training/plans/${id}`,
      "Plan not found or unauthorized"
    );
  }

  const oldDays = existingPlan.days || 0;
  const oldDuration = existingPlan.duration_weeks || 0;
  const oldStartDate = existingPlan.start_date ? new Date(existingPlan.start_date) : null;
  
  const newDays = parseInt(trainingDays);
  const newDuration = parseInt(duration);

  // Use provided start date or keep existing one
  const startDate = startDateStr ? new Date(startDateStr) : (oldStartDate || new Date());
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (newDuration * 7 - 1)); // duration weeks * 7 days - 1

  // Update the plan
  const { data: plan, error: planError } = await supabase
    .from("workout_plans")
    .update({
      name: planName,
      user_id: clientId,
      days: newDays,
      duration_weeks: newDuration,
      description: description,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    })
    .eq("id", id)
    .eq("trainer_id", user.id)
    .select()
    .single();

  if (planError) {
    console.error("Error updating plan:", planError);
    return encodedRedirect(
      "error",
      `/training/plans/${id}`,
      "Failed to update workout plan"
    );
  }

  // Get existing workout days for this plan
  const { data: existingWorkoutDays } = await supabase
    .from("workout_days")
    .select("id, day_number, workout_type")
    .eq("plan_id", id)
    .order("day_number", { ascending: true });

  const existingDayNumbers = existingWorkoutDays?.map(day => day.day_number) || [];
  
  // Define workout types based on number of days
  const workoutTypes: Record<number, Array<"legs" | "chest_triceps" | "back_biceps" | "full_body">> = {
    3: ["legs", "chest_triceps", "back_biceps"],
    4: ["legs", "chest_triceps", "back_biceps", "full_body"],
    5: ["legs", "chest_triceps", "back_biceps", "legs", "full_body"]
  };

  const types = workoutTypes[newDays] || Array(newDays).fill("full_body");

  // Handle changes in workout days
  if (oldDays !== newDays) {
    if (newDays > oldDays) {
      // Add new days
      const newWorkoutDays = [];
      
      for (let i = oldDays; i < newDays; i++) {
        newWorkoutDays.push({
          plan_id: id,
          day_number: i + 1,
          workout_type: types[i]
        });
      }
      
      if (newWorkoutDays.length > 0) {
        await supabase.from("workout_days").insert(newWorkoutDays);
      }
    } 
    else if (newDays < oldDays) {
      // We need to delete days and their exercises
      for (let i = newDays + 1; i <= oldDays; i++) {
        // Find the workout day to delete
        const dayToDelete = existingWorkoutDays?.find(day => day.day_number === i);
        
        if (dayToDelete) {
          // First delete associated exercises
          await supabase
            .from("exercises")
            .delete()
            .eq("workout_day_id", dayToDelete.id);
          
          // Then delete the workout day
          await supabase
            .from("workout_days")
            .delete()
            .eq("id", dayToDelete.id);
        }
      }
    }
  }

  // Update workout types to ensure they match our standard pattern
  const updatedDays = Math.min(oldDays, newDays); // Process only days that existed before and after update
  
  for (let i = 0; i < updatedDays; i++) {
    const dayNumber = i + 1;
    const existingDay = existingWorkoutDays?.find(day => day.day_number === dayNumber);
    
    if (existingDay) {
      await supabase
        .from("workout_days")
        .update({
          workout_type: types[i]
        })
        .eq("id", existingDay.id);
    }
  }

  // Handle workout plan weeks
  // First fetch existing weeks
  const { data: existingWeeks } = await supabase
    .from("workout_plan_weeks")
    .select("id, week_number, status")
    .eq("plan_id", id)
    .order("week_number", { ascending: true });

  const hasStartDateChanged = startDateStr && oldStartDate && 
    (new Date(startDateStr).getTime() !== oldStartDate.getTime());
  
  // If duration or start date changed, we need to update the weeks
  if (oldDuration !== newDuration || hasStartDateChanged) {
    // If duration decreased, delete excess weeks
    if (newDuration < oldDuration) {
      for (let weekNum = newDuration + 1; weekNum <= oldDuration; weekNum++) {
        const weekToDelete = existingWeeks?.find(week => week.week_number === weekNum);
        
        if (weekToDelete) {
          await supabase
            .from("workout_plan_weeks")
            .delete()
            .eq("id", weekToDelete.id);
        }
      }
    }
    
    // Update existing weeks with new dates
    for (let weekNum = 1; weekNum <= Math.min(oldDuration, newDuration); weekNum++) {
      const weekToUpdate = existingWeeks?.find(week => week.week_number === weekNum);
      
      if (weekToUpdate) {
        // Calculate new dates
        const weekStartDate = new Date(startDate);
        weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);
        
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        
        await supabase
          .from("workout_plan_weeks")
          .update({
            start_date: weekStartDate.toISOString(),
            end_date: weekEndDate.toISOString()
          })
          .eq("id", weekToUpdate.id);
      }
    }
    
    // Add new weeks if duration increased
    if (newDuration > oldDuration) {
      const newWeeks = [];
      
      for (let weekNum = oldDuration + 1; weekNum <= newDuration; weekNum++) {
        // Calculate week start and end date
        const weekStartDate = new Date(startDate);
        weekStartDate.setDate(weekStartDate.getDate() + (weekNum - 1) * 7);
        
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        
        newWeeks.push({
          plan_id: id,
          week_number: weekNum,
          start_date: weekStartDate.toISOString(),
          end_date: weekEndDate.toISOString(),
          status: "active" as "active" | "completed" | "pending"
        });
      }
      
      if (newWeeks.length > 0) {
        await supabase
          .from("workout_plan_weeks")
          .insert(newWeeks);
      }
    }
  }

  return redirect(`/training/plans/${id}?success=Plan%20updated%20successfully`);
}

// Add functions for exercise management
export async function getWorkoutExercises(planId: string, day: number) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized", data: null };
  }
  
  // First, find or create the workout day
  let workoutDayId: string;
  
  // Check if workout day exists
  const { data: existingDay } = await supabase
    .from("workout_days")
    .select("id")
    .eq("plan_id", planId)
    .eq("day_number", day)
    .single();

    console.log("existingDay", existingDay);
    
  if (existingDay) {
    workoutDayId = existingDay.id;
  } else {
    // Create a new workout day
    const { data: newDay, error: dayError } = await supabase
      .from("workout_days")
      .insert({
        plan_id: planId,
        day_number: day,
        workout_type: "legs" // Default type, can be updated later
      })
      .select("id")
      .single();
      
    if (dayError) {
      console.error("Error creating workout day:", dayError);
      return { error: dayError.message, data: null };
    }
    
    workoutDayId = newDay.id;
  }

  // Get exercises for the workout day
  const { data: exercises, error: exercisesError } = await supabase
    .from("exercises")
    .select(`
      id,
      name,
      sets,
      reps,
      rest_time,
      youtube_link,
      notes
    `)
    .eq("workout_day_id", workoutDayId);

  if (exercisesError) {
    console.error("Error fetching exercises:", exercisesError);
    return { error: exercisesError.message, data: null };
  }

  // Transform the data to match the WorkoutExercise type
  const typedExercises = exercises?.map(exercise => ({
    ...exercise,
    rest_time: exercise.rest_time as string | undefined,
    youtube_link: exercise.youtube_link as string | undefined,
    notes: exercise.notes as string | undefined
  })) || [];

  console.log("typedExercises", typedExercises);

  return { data: typedExercises, error: null };
}

export async function saveExercise(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized", success: false };
  }

  const planId = formData.get("planId")?.toString();
  const day = formData.get("day")?.toString();
  const exerciseId = formData.get("exerciseId")?.toString();
  const name = formData.get("name")?.toString();
  const sets = formData.get("sets")?.toString();
  const reps = formData.get("reps")?.toString();
  const restTime = formData.get("restTime")?.toString();
  const youtubeLink = formData.get("youtubeLink")?.toString();
  const notes = formData.get("notes")?.toString();

  if (!planId || !day || !name || !sets || !reps) {
    return { error: "Required fields missing", success: false };
  }

  // Check if the plan belongs to the trainer
  const { data: plan } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("id", planId)
    .eq("trainer_id", user.id)
    .single();

  if (!plan) {
    return { error: "Unauthorized access to this plan", success: false };
  }
  
  // Get the workout day for this plan and day number
  const { data: workoutDay, error: workoutDayError } = await supabase
    .from("workout_days")
    .select("id")
    .eq("plan_id", planId)
    .eq("day_number", parseInt(day))
    .single();
    
  if (workoutDayError || !workoutDay) {
    return { error: "Workout day not found for this plan", success: false };
  }
  
  const workoutDayId = workoutDay.id;

  // Update or insert the exercise
  let result;
  if (exerciseId) {
    // Update existing exercise
    result = await supabase
      .from("exercises")
      .update({
        name,
        sets: parseInt(sets),
        reps: parseInt(reps),
        rest_time: restTime,
        youtube_link: youtubeLink,
        notes,
      })
      .eq("id", exerciseId);
  } else {
    // Insert new exercise
    result = await supabase.from("exercises").insert({
      workout_day_id: workoutDayId,
      name,
      sets: parseInt(sets),
      reps: parseInt(reps),
      rest_time: restTime,
      youtube_link: youtubeLink,
      notes,
    });
  }

  if (result.error) {
    console.error("Error saving exercise:", result.error);
    return { error: result.error.message, success: false };
  }

  return { success: true, error: null };
}

export async function deleteExercise(exerciseId: string, planId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized", success: false };
  }

  // Check if the plan belongs to the trainer
  const { data: plan } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("id", planId)
    .eq("trainer_id", user.id)
    .single();

  if (!plan) {
    return { error: "Unauthorized access to this plan", success: false };
  }

  const { error: deleteError } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId);

  if (deleteError) {
    console.error("Error deleting exercise:", deleteError);
    return { error: deleteError.message, success: false };
  }

  return { success: true, error: null };
}

export async function deletePlanAction(planId: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return encodedRedirect("error", "/sign-in", "Session expired");
  }

  // Check if the plan belongs to the trainer
  const { data: plan, error: planCheckError } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("id", planId)
    .eq("trainer_id", user.id)
    .single();

  if (planCheckError || !plan) {
    console.error("Plan not found or unauthorized:", planCheckError);
    return encodedRedirect(
      "error",
      "/training/plans",
      "Plan not found or you're not authorized to delete it"
    );
  }

  // Get all workout days for this plan to find related exercises
  const { data: workoutDays, error: workoutDaysError } = await supabase
    .from("workout_days")
    .select("id")
    .eq("plan_id", planId);

  if (workoutDaysError) {
    console.error("Error fetching workout days:", workoutDaysError);
    return encodedRedirect(
      "error",
      `/training/plans/${planId}`,
      "Error preparing to delete plan"
    );
  }

  // Delete in the correct order to maintain referential integrity
  // 1. Delete all exercises for all workout days
  if (workoutDays && workoutDays.length > 0) {
    const workoutDayIds = workoutDays.map(day => day.id);
    
    const { error: exercisesDeleteError } = await supabase
      .from("exercises")
      .delete()
      .in("workout_day_id", workoutDayIds);

    if (exercisesDeleteError) {
      console.error("Error deleting exercises:", exercisesDeleteError);
      return encodedRedirect(
        "error",
        `/training/plans/${planId}`,
        "Error deleting exercises"
      );
    }
  }

  // 2. Delete all workout days
  const { error: workoutDaysDeleteError } = await supabase
    .from("workout_days")
    .delete()
    .eq("plan_id", planId);

  if (workoutDaysDeleteError) {
    console.error("Error deleting workout days:", workoutDaysDeleteError);
    return encodedRedirect(
      "error",
      `/training/plans/${planId}`,
      "Error deleting workout days"
    );
  }

  // 3. Finally delete the workout plan
  const { error: planDeleteError } = await supabase
    .from("workout_plans")
    .delete()
    .eq("id", planId)
    .eq("trainer_id", user.id);

  if (planDeleteError) {
    console.error("Error deleting plan:", planDeleteError);
    return encodedRedirect(
      "error",
      `/training/plans/${planId}`,
      "Error deleting workout plan"
    );
  }

  // Successfully deleted everything
  return redirect("/training/plans?success=Plan%20successfully%20deleted");
} 