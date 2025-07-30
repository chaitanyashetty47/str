// New file: API route to fetch trainer's client options without triggering RSC refresh loops
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTrainerClientOptions } from "@/actions/trainer-clients/get-trainer-client-options";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const options = await getTrainerClientOptions(user.id);
    return NextResponse.json(options, { status: 200 });
  } catch (err) {
    console.error("Error fetching trainer client options", err);
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 });
  }
} 