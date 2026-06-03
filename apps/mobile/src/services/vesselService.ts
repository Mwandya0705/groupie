import { supabase } from "./supabase";
import { Vessel } from "../types/domain";

export async function searchVessels(query: string): Promise<Vessel[]> {
  let q = supabase
    .from("vessels")
    .select("id,name,registration_number,vessel_type,status,owner_info,last_sighted")
    .order("created_at", { ascending: false })
    .limit(50);

  const term = query.trim();
  if (term) {
    q = q.or(`name.ilike.%${term}%,registration_number.ilike.%${term}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Vessel[];
}
