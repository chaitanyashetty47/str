import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface OneRMMap {
  [listExerciseId: string]: number;
}

export function useClientMaxLifts(clientId?: string) {
  const [data, setData] = useState<OneRMMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    async function fetchMax() {
      setIsLoading(true);
      const supabase = createClient();
      const { data: rows, error } = await supabase
        .from("client_max_lifts")
        .select("list_exercise_id, max_weight")
        .eq("client_id", clientId!);
      if (error) {
        setError(error.message);
      } else {
        const map: OneRMMap = {};
        rows?.forEach((r: any) => {
          if (r.list_exercise_id && r.max_weight) {
            map[r.list_exercise_id] = r.max_weight as number;
          }
        });
        setData(map);
      }
      setIsLoading(false);
    }
    fetchMax();
  }, [clientId]);

  return { oneRMMap: data, isLoading, error } as const;
} 