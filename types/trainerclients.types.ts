import { Database } from "@/utils/supabase/types";

type Client = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "name" | "email"
>;

type TrainerClient =  {
  client_id: string;
  client: Client;
};

export type { Client, TrainerClient };
