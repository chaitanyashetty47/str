// "use server";

// import { createClient } from "@/utils/supabase/server";
// import { revalidatePath } from "next/cache";
// import prisma from "@/utils/prisma/prismaClient";

// // use `prisma` in your application to read and write data in your DB
// interface ExerciseFilters {
//   searchQuery?: string;
//   page?: number;
//   perPage?: number;
// }

// export async function getTrainerExercises(filters: ExerciseFilters = {}) {
//   try {
//     const supabase = await createClient();
    
//     // Get the current user's ID
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
    
//     if (userError || !user) {
//       return { data: null, error: "Unauthorized" };
//     }
    
//     // Set default pagination values
//     const perPage = filters.perPage || 10;
//     const page = filters.page || 1;
//     const offset = (page - 1) * perPage;
    
//     // Start building the query
//     let query = supabase
//       .from("exercise")
//       .select("*", { count: "exact" })
//       .eq("trainer_id", user.id)
//       .order("name");
    
//     // Apply search filter if provided
//     if (filters.searchQuery) {
//       query = query.ilike("name", `%${filters.searchQuery}%`);
//     }
    
//     // Apply pagination
//     query = query.range(offset, offset + perPage - 1);
    
//     // Execute the query
//     const { data, error, count } = await query;
    
//     if (error) {
//       console.error("Error fetching exercises:", error);
//       return { data: null, error: "Failed to fetch exercises" };
//     }
    
//     return { 
//       data, 
//       error: null,
//       pagination: {
//         total: count || 0,
//         page,
//         perPage,
//         totalPages: count ? Math.ceil(count / perPage) : 0
//       }
//     };
//   } catch (error) {
//     console.error("Error in getTrainerExercises:", error);
//     return { data: null, error: "An unexpected error occurred" };
//   }
// }

// export async function createExercise(formData: FormData) {
//   try {
//     const name = formData.get('name') as string;
//     const youtubeLink = formData.get('youtube_link') as string;
    
//     if (!name || !name.trim()) {
//       return { data: null, error: "Exercise name is required" };
//     }
    
//     const supabase = await createClient();
    
//     // Get the current user's ID
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
    
//     if (userError || !user) {
//       return { data: null, error: "Unauthorized" };
//     }
    
//     // Insert new exercise
//     const { data, error } = await supabase
//       .from("exercise")
//       .insert({
//         name,
//         youtube_link: youtubeLink || null,
//         trainer_id: user.id
//       })
//       .select()
//       .single();
    
//     if (error) {
//       console.error("Error creating exercise:", error);
//       return { data: null, error: error.message };
//     }
    
//     // Revalidate the exercises path to refresh the data
//     revalidatePath('/training/exercises');
    
//     return { data, error: null };
//   } catch (error) {
//     console.error("Error in createExercise:", error);
//     return { data: null, error: "An unexpected error occurred" };
//   }
// }

// export async function searchExercises(searchQuery: string) {
//   try {
//     const supabase = await createClient();
    
//     // Get the current user's ID
//     const { data: { user }, error: userError } = await supabase.auth.getUser();
    
//     if (userError || !user) {
//       return { data: null, error: "Unauthorized" };
//     }
    
//     // Search for exercises by name
//     const { data, error } = await supabase
//       .from("exercise")
//       .select("id, name, youtube_link")
//       .eq("trainer_id", user.id)
//       .ilike("name", `%${searchQuery}%`)
//       .order("name")
//       .limit(10);
    
//     if (error) {
//       console.error("Error searching exercises:", error);
//       return { data: null, error: "Failed to search exercises" };
//     }
    
//     return { data, error: null };
//   } catch (error) {
//     console.error("Error in searchExercises:", error);
//     return { data: null, error: "An unexpected error occurred" };
//   }
// } 