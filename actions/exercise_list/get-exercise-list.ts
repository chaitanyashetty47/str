import prisma from "@/utils/prisma/prismaClient";

export async function getExerciseList() {
  const rows = await prisma.workout_exercise_lists.findMany({
    select: {
      id: true,
      name: true,
      youtube_link: true,
      type: true,  // BodyPart
    },
  });
  
  //Flatten the exercise list so users get array of id, name, youtube_link, type
  return rows.map(({ id, name, youtube_link, type }) => ({
    id,
    name,
    youtube_link,
    type,
  }));
}