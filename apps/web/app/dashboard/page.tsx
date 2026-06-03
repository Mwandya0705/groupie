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
  Filter
} from "lucide-react";
import Link from "next/link";
import DashboardMap from "../../components/DashboardMap";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await fetchDashboardStats();

  const cards = [
    { label: "Active Patrols", value: stats.totalPatrols, icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Total Incidents", value: stats.totalIncidents, icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Tracked Vessels", value: stats.totalVessels, icon: Ship, color: "text-accent", bg: "bg-accent/10" },
    { label: "Registered Users", value: stats.totalUsers, icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
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
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-inkmuted group-focus-within:text-accent transition-colors" />
            <input 
              className="bg-surface border border-hairline rounded-xl py-2.5 pl-10 pr-4 text-sm text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/30 w-64" 
              placeholder="Search incidents, vessels..."
            />
          </div>
          <button className="bg-surface border border-hairline p-2.5 rounded-xl text-inkmuted hover:text-ink transition-colors">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Primary Visual Section: Heatmap & Quick Stats */}
      <div className="grid gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface border border-hairline rounded-3xl overflow-hidden shadow-2xl relative">
            <DashboardMap incidents={stats.incidents} />
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

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Critical Feed */}
        <div className="lg:col-span-2 space-y-6">
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
              {stats.recentIncidents.map((incident: any) => (
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

        {/* Sector Analytics */}
        <div className="space-y-6">
          <div className="bg-surface border border-hairline rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <h2 className="font-bold text-ink mb-8 text-lg">Sector Analytics</h2>
            <div className="space-y-6">
              {stats.violationsByType.map((v: any, i: number) => (
                <div key={v.type} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-inkmuted">{v.type.replace('_', ' ')}</span>
                    <span className="text-accent">{v.count} Cases</span>
                  </div>
                  <div className="h-2 w-full bg-surface2/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${i % 2 === 0 ? 'from-accent to-blue-500' : 'from-red-500 to-orange-500'} transition-all duration-1000 ease-out`} 
                      style={{ width: `${(v.count / stats.totalIncidents) * 100}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-hairline">
               <div className="flex items-center justify-between p-4 bg-canvas rounded-2xl border border-hairline/50 border-dashed">
                <div>
                  <p className="text-[9px] font-black text-inkmuted uppercase tracking-[0.2em]">Dominant Threat</p>
                  <p className="text-sm font-bold text-ink capitalize mt-0.5">{stats.mostCommonViolation.replace('_', ' ')}</p>
                </div>
                <div className="h-8 w-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-hairline rounded-3xl p-6 flex items-center gap-4 group cursor-help transition-colors hover:bg-surface2/20">
            <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">System Security</p>
              <p className="text-[10px] text-inkmuted">All encryption protocols nominal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
