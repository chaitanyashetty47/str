"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getSubscriptionPlans() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("SubscriptionPlan").select("*");
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
