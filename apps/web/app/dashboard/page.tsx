import { fetchDashboardStats } from "../../lib/queries";
import {
  Activity,
  AlertCircle,
  Ship,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight,
  ShieldAlert,
  Search,
  Filter,
  Layers,
  Crosshair,
  Flame
} from "lucide-react";
import Link from "next/link";
import DashboardMap from "../../components/DashboardMap";
import { GeneralReportButton } from "../../components/GeneralReportButton";
import { SearchInput } from "../../components/SearchInput";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const q = (resolvedParams.q || "").toLowerCase();
  const stats = await fetchDashboardStats();

  const cards = [
    { label: "Active Patrols", value: stats.totalPatrols, icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Total Incidents", value: stats.totalIncidents, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Tracked Vessels", value: stats.totalVessels, icon: Ship, color: "text-accent", bg: "bg-accent/10" },
    { label: "Registered Users", value: stats.totalUsers, icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  // ---- Richer Sector Analytics (computed from reported incidents) ----
  const allIncidents: any[] = stats.incidents ?? [];
  const filteredIncidents = q
    ? allIncidents.filter(
        (i) =>
          i.type.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          i.id.toLowerCase().includes(q)
      )
    : allIncidents;
  const totalInc = filteredIncidents.length;

  // Lightweight payload for the CLIENT components (map + report). The full
  // `ai_analysis` (which holds each incident's ~300-word generated report) is
  // heavy and not needed in the browser, so we strip it before serializing —
  // this is the main thing that was making the dashboard "load too much".
  const lightIncidents = filteredIncidents.map((i) => ({
    id: i.id,
    type: i.type,
    description: i.description ?? null,
    latitude: i.latitude,
    longitude: i.longitude,
    created_at: i.created_at,
  }));
  const bucket = (i: any) => `${Number(i.latitude).toFixed(2)}, ${Number(i.longitude).toFixed(2)}`;

  const zoneMap = new Map<string, { count: number; types: Record<string, number> }>();
  const typeMap = new Map<string, { count: number; zones: Set<string> }>();
  for (const i of filteredIncidents) {
    if (typeof i.latitude !== "number" || typeof i.longitude !== "number") continue;
    const z = bucket(i);
    const zEntry = zoneMap.get(z) ?? { count: 0, types: {} };
    zEntry.count++;
    zEntry.types[i.type] = (zEntry.types[i.type] ?? 0) + 1;
    zoneMap.set(z, zEntry);

    const tEntry = typeMap.get(i.type) ?? { count: 0, zones: new Set<string>() };
    tEntry.count++;
    tEntry.zones.add(z);
    typeMap.set(i.type, tEntry);
  }
  const zones = [...zoneMap.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.count - a.count);
  const recurringZones = zones.filter((z) => z.count >= 2);
  const topZone = zones[0];
  const typeDetail = [...typeMap.entries()]
    .map(([type, v]) => ({
      type,
      count: v.count,
      zones: v.zones.size,
      pct: totalInc ? Math.round((v.count / totalInc) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
  const barColors = [
    "from-accent to-blue-500",
    "from-red-500 to-orange-500",
    "from-purple-500 to-fuchsia-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-yellow-500",
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-10">
      {/* Header with Search/Filters */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-ink tracking-tight">Command Center</h1>
          <p className="text-inkmuted mt-1 font-medium italic">Global Surveillance & IUU Detection Protocol</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput placeholder="Search incidents, vessels..." />
          <GeneralReportButton incidents={lightIncidents} />
          <button className="bg-surface border border-hairline p-2.5 rounded-xl text-inkmuted hover:text-ink transition-colors">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Primary Visual Section: Heatmap & Quick Stats */}
      <div className="grid gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface border border-hairline rounded-3xl overflow-hidden shadow-2xl relative">
            <DashboardMap incidents={lightIncidents} />
          </div>
        </div>

        {/* Vertical Stats Column */}
        <div className="space-y-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-surface border border-hairline p-6 rounded-2xl shadow-sm hover:border-hairline transition-all group relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                <div className={`${card.bg} p-3 rounded-xl transition-transform group-hover:scale-110 duration-300`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-inkmuted uppercase tracking-widest">{card.label}</p>
                  <h3 className="text-2xl font-bold text-ink tracking-tighter">{card.value}</h3>
                </div>
              </div>
              <div className={`absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity`}>
                <card.icon className={`h-16 w-16 ${card.color}`} />
              </div>
            </div>
          ))}
          
          <div className="bg-gradient-to-br from-accent to-blue-700 p-6 rounded-2xl shadow-xl text-ink">
            <h4 className="font-bold mb-2">Fleet Readiness</h4>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black tracking-tighter">98%</span>
              <span className="text-xs font-bold bg-surface/20 px-2 py-1 rounded-md mb-2">Optimum</span>
            </div>
            <div className="h-1 w-full bg-surface/20 rounded-full mt-4">
              <div className="h-full bg-surface w-[98%] rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Critical Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface border border-hairline rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface2/30">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                <h2 className="font-bold text-ink uppercase tracking-tight text-sm">Priority Alert Stream</h2>
              </div>
              <Link href="/dashboard/incidents" className="text-xs font-bold text-accent hover:text-accent flex items-center gap-1 transition-colors">
                Archive Log <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-hairline/50">
              {filteredIncidents.slice(0, 5).map((incident: any) => (
                <div key={incident.id} className="p-6 hover:bg-surface2/40 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${incident.type.includes('illegal') ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink capitalize group-hover:text-accent transition-colors">{incident.type.replace('_', ' ')}</p>
                        <p className="text-[10px] text-inkmuted font-mono tracking-tighter">REF: {incident.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-bold text-inkmuted uppercase flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="text-[9px] text-inkmuted mt-1 uppercase tracking-widest">{new Date(incident.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-inkmuted leading-relaxed mb-4 pl-14">{incident.description}</p>
                  <div className="flex items-center gap-4 pl-14">
                    <div className="flex items-center gap-1 text-[10px] text-inkmuted bg-surface/50 px-2 py-1 rounded-md">
                      <MapPin className="h-3 w-3 text-accent" />
                      {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                    </div>
                    {incident.ai_analysis?.confidence_score > 0 && (
                      <div className="text-[10px] font-bold text-accent bg-accent/5 px-2.5 py-1 rounded-md border border-accent/10">
                        AI VERIFIED: {(incident.ai_analysis.confidence_score * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sector Analytics — expanded & detailed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-hairline rounded-3xl p-7 shadow-xl relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-extrabold text-ink text-xl tracking-tight flex items-center gap-2">
                  <Layers className="h-5 w-5 text-accent" /> Sector Analytics
                </h2>
                <p className="text-xs text-inkmuted mt-1">Violation distribution & spatial concentration across reported incidents</p>
              </div>
              <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">Live</span>
            </div>

            {/* Summary mini-stats */}
            <div className="grid grid-cols-3 gap-3 mb-7">
              {[
                { label: "Incidents", value: totalInc, icon: AlertCircle, color: "text-red-400" },
                { label: "Active Zones", value: zones.length, icon: Crosshair, color: "text-accent" },
                { label: "Recurring", value: recurringZones.length, icon: Flame, color: "text-orange-400" },
              ].map((s) => (
                <div key={s.label} className="bg-canvas border border-hairline rounded-2xl p-3 text-center">
                  <s.icon className={`h-4 w-4 mx-auto mb-1.5 ${s.color}`} />
                  <p className="text-2xl font-black text-ink leading-none">{s.value}</p>
                  <p className="text-[8px] font-bold text-inkmuted uppercase tracking-[0.15em] mt-1.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Per-type detailed breakdown */}
            <p className="text-[10px] font-black text-inkmuted uppercase tracking-[0.2em] mb-4">Violation Breakdown</p>
            <div className="space-y-5">
              {typeDetail.length === 0 && (
                <p className="text-xs text-inkmuted italic py-6 text-center">No incidents reported yet.</p>
              )}
              {typeDetail.map((v, i) => (
                <div key={v.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-ink capitalize">{v.type.replace(/_/g, " ")}</span>
                    <span className="text-xs font-black text-accent">{v.count} <span className="text-inkmuted font-medium">({v.pct}%)</span></span>
                  </div>
                  <div className="h-2.5 w-full bg-surface2/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${barColors[i % barColors.length]} transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.max(v.pct, 3)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-inkmuted font-medium flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-inkmuted" />
                    Detected across {v.zones} zone{v.zones === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
            </div>

            {/* Top recurring hotspot callout */}
            {topZone && topZone.count >= 2 && (
              <div className="mt-7 p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em]">Top Recurring Hotspot</p>
                    <p className="text-sm font-mono font-bold text-ink mt-0.5">{topZone.key}</p>
                    <p className="text-[10px] text-inkmuted mt-0.5">
                      {Object.entries(topZone.types)
                        .sort((a, b) => (b[1] as number) - (a[1] as number))
                        .map(([t, n]) => `${t.replace(/_/g, " ")} (${n})`)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-base font-black text-red-400">{topZone.count}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dominant threat */}
            <div className="mt-4 pt-5 border-t border-hairline">
              <div className="flex items-center justify-between p-4 bg-canvas rounded-2xl border border-hairline/50 border-dashed">
                <div>
                  <p className="text-[9px] font-black text-inkmuted uppercase tracking-[0.2em]">Dominant Threat</p>
                  <p className="text-sm font-bold text-ink capitalize mt-0.5">{stats.mostCommonViolation.replace(/_/g, " ")}</p>
                </div>
                <div className="h-8 w-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Link href="/dashboard/hotspots" className="flex items-center justify-center gap-1.5 w-full py-3 rounded-xl bg-surface2/40 border border-hairline text-accent font-bold text-[11px] uppercase tracking-[0.15em] hover:bg-surface2/70 transition-all">
                Open Hotspot Analytics <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
