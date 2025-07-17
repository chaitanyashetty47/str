import prisma from "@/utils/prisma/prismaClient";

/**
 * Retrieve a lightweight list of a trainer's clients.
 * Only the client user id and their display name are returned so that
 * the result can be used directly inside dropdowns / comboboxes.
 */
export async function getTrainerClientOptions(trainerId: string) {
  const rows = await prisma.trainer_clients.findMany({
    where: { trainer_id: trainerId },
    select: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      assigned_at: "asc",
    },
  });

  // Flatten the nested profile relation so callers get a clean array
  // [{ id, name }] that can be fed straight into UI components.
  return rows.map(({ client }) => ({
    id: client.id,
    name: client.name,
  }));
} 