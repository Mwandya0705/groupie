import { createClient } from "@supabase/supabase-js";

// Note: In a real app we'd use the centralized client, but for this utility we'll define the interface
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchVessels() {
  const { data, error } = await supabase.from("vessels").select("*").order("last_sighted", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchDashboardAnalytics() {
  const { data, error } = await supabase.from("dashboard_analytics").select("*");
  if (error) throw error;
  return data;
}

export async function generateAIReport(incidents: any[]) {
  // Simulate AI processing of incident descriptions and metadata
  const total = incidents.length;
  const critical = incidents.filter(i => (i.ai_analysis?.threat_level === 'critical' || i.ai_analysis?.threat_level === 'high')).length;
  
  return {
    summary: `Analysis of ${total} incidents identifies a ${critical > 2 ? 'high' : 'moderate'} surveillance requirement in the eastern sector.`,
    recommendation: critical > 2 ? "Immediate deployment of specialized water-patrol units recommended." : "Continue regular monitoring schedules with emphasis on gear-violation hotspots.",
    threatLevel: critical > 2 ? 'Critical' : 'Moderate'
  };
}
