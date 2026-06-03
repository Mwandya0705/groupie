import { createClient } from "./supabase/server";

export async function fetchDashboardStats() {
  const supabase = await createClient();

  const [
    { count: patrolCount, error: patrolError }, 
    { data: incidents, error: incidentError },
    { count: vesselCount, error: vesselError },
    { count: userCount, error: userError }
  ] = await Promise.all([
    supabase.from("patrols").select("id", { count: "exact", head: true }),
    supabase.from("incidents").select("id,type,created_at,latitude,longitude,description, ai_analysis, evidence(image_url)").order("created_at", { ascending: false }),
    supabase.from("vessels").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true })
  ]);

  if (patrolError) throw patrolError;
  if (incidentError) throw incidentError;
  if (vesselError) throw vesselError;
  if (userError) throw userError;

  const typedIncidents = incidents ?? [];
  const totalIncidents = typedIncidents.length;

  const typeCounts = typedIncidents.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  const mostCommonViolation = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

  const monthlyIncidentsMap = typedIncidents.reduce<Record<string, number>>((acc, item) => {
    const month = new Date(item.created_at).toISOString().slice(0, 7);
    acc[month] = (acc[month] ?? 0) + 1;
    return acc;
  }, {});

  const hotspots = typedIncidents.reduce<Record<string, number>>((acc, item) => {
    const bucket = `${item.latitude.toFixed(2)},${item.longitude.toFixed(2)}`;
    acc[bucket] = (acc[bucket] ?? 0) + 1;
    return acc;
  }, {});

  const activeHotspots = Object.entries(hotspots)
    .map(([coordinates, count]) => ({ coordinates, count }))
    .sort((a, b) => b.count - a.count);

  const incidentsPerMonth = Object.entries(monthlyIncidentsMap).map(([month, count]) => ({ month, count }));
  const violationsByType = Object.entries(typeCounts).map(([type, count]) => ({ type, count }));

  return {
    totalPatrols: patrolCount ?? 0,
    totalIncidents,
    totalVessels: vesselCount ?? 0,
    totalUsers: userCount ?? 0,
    mostCommonViolation,
    incidentsPerMonth,
    violationsByType,
    activeHotspots,
    recentIncidents: typedIncidents.slice(0, 5),
    incidents: typedIncidents
  };
}

export async function fetchPatrolRoutes(options: { 
  page?: number; 
  limit?: number; 
  type?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
} = {}) {
  const { page = 1, limit = 10, type, sortBy = 'start_time', order = 'desc' } = options;
  const supabase = await createClient();
  
  let query = supabase
    .from("patrols")
    .select("id,patrol_type,start_time,end_time,route", { count: "exact" });

  if (type && type !== 'all') {
    query = query.eq('patrol_type', type);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query
    .order(sortBy, { ascending: order === 'asc' })
    .range(from, to);

  const { data, count, error } = await query;
  
  if (error) throw error;
  
  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 0
  };
}

export async function fetchVessels() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("vessels").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * All incidents, newest first — feeds the Hotspot Analytics map/list and the
 * general-report generator. Includes description so the report can read the
 * field officer's notes.
 */
export async function fetchIncidents() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incidents")
    .select("id,type,description,latitude,longitude,created_at,ai_analysis,evidence(image_url)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAIAnalysis() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("incidents")
    .select("id, type, created_at, ai_analysis, evidence(image_url)")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data ?? [];
}

export async function fetchProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data ?? [];
}

export async function fetchAuditLogs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(`
      *,
      profiles (
        full_name,
        username
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);
  
  if (error) throw error;
  return data ?? [];
}

export async function fetchSyncLogs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sync_logs")
    .select(`
      *,
      profiles (
        full_name,
        username
      )
    `)
    .order("last_sync_at", { ascending: false })
    .limit(50);
  
  if (error) throw error;
  return data ?? [];
}

export async function fetchUserRoles() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("roles").select("*");
  if (error) throw error;
  return data ?? [];
}

