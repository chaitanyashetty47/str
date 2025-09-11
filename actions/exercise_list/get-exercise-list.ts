import prisma from "@/utils/prisma/prismaClient";

export async function getExerciseList() {
  const rows = await prisma.workout_exercise_lists.findMany({
    select: {
      id: true,
      name: true,
      youtube_link: true,
      type: true,  // BodyPart
      is_reps_based: true,  // NEW: Include reps-based flag
    },
  });
  
  //Flatten the exercise list so users get array of id, name, youtube_link, type, is_reps_based
  return rows.map(({ id, name, youtube_link, type, is_reps_based }) => ({
    id,
    name,
    youtube_link,
    type,
    is_reps_based,
  }));
}