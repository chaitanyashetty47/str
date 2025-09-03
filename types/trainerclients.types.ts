import { Database } from "@/utils/supabase/types";

type Client = Pick<
  Database["public"]["Tables"]["users_profile"]["Row"],
  "name" | "email"
>;

type TrainerClient =  {
  client_id: string;
  client: Client;
};

export type { Client, TrainerClient };
