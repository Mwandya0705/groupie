import { fetchDashboardStats, fetchIncidents } from "../../../lib/queries";
import { Activity, Map as MapIcon, TrendingUp, AlertTriangle, Crosshair, Zap } from "lucide-react";
import dynamic from "next/dynamic";

const IncidentHeatmap = dynamic(() => import("../../../components/IncidentHeatmap"), { ssr: false });

export const dynamic = "force-dynamic";

export default async function HotspotsPage() {
  const [stats, incidents] = await Promise.all([
    fetchDashboardStats(),
    fetchIncidents()
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-4">
            Hotspot Intelligence
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">High Risk Activity detected</span>
            </div>
          </h1>
          <p className="text-slate-400 mt-2 font-medium italic">Spatial Clustering & AI Predictive Violation Modeling</p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: "Critical Zones", value: stats.activeHotspots.filter(h => h.count > 3).length, icon: AlertTriangle, color: "text-red-500", sub: "Priority 1 Areas" },
          { label: "Cluster Density", value: `${(stats.totalIncidents / (stats.activeHotspots.length || 1)).toFixed(1)}`, icon: Crosshair, color: "text-teal-500", sub: "Incidents per zone" },
          { label: "Risk Index", value: "8.4", icon: TrendingUp, color: "text-orange-500", sub: "Calculated severity" },
          { label: "Edge Response", value: "14s", icon: Zap, color: "text-blue-500", sub: "Avg detection time" },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0d1b2a] border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
             <stat.icon className={`absolute -right-4 -bottom-4 h-20 w-20 ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
             <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
             <p className="text-xs text-slate-400 mt-2 font-medium italic">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Spatial Map */}
        <div className="lg:col-span-2 bg-[#0d1b2a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-6 left-6 z-10 bg-[#060e17]/80 backdrop-blur-md border border-slate-800 p-4 rounded-2xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
              <MapIcon className="h-4 w-4 text-teal-400" />
              Tactical Heat Distribution
            </h2>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Live Spatial Incident Registry</p>
          </div>
          <div className="h-[500px] w-full">
            <IncidentHeatmap incidents={incidents} />
          </div>
        </div>

        {/* Top Hotspots List */}
        <div className="bg-[#0d1b2a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <div className="p-6 border-b border-slate-800 bg-[#112233]/30">
            <h2 className="font-bold text-white uppercase tracking-tight text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-500" />
              Density Analysis
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {stats.activeHotspots.map((hotspot, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#060e17] border border-slate-800 hover:border-teal-500/30 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                      i === 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Zone {hotspot.coordinates}</p>
                      <p className="text-[9px] text-slate-500 font-mono">LAT/LONG BUCKET</p>
                    </div>
                  </div>
                  <span className={`text-xs font-black ${i === 0 ? 'text-red-500' : 'text-teal-400'}`}>
                    {hotspot.count} EVENTS
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${i === 0 ? 'bg-red-500' : 'bg-teal-500'}`}
                    style={{ width: `${Math.min((hotspot.count / (stats.activeHotspots[0]?.count || 1)) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            ))}

            {stats.activeHotspots.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20">
                <Crosshair className="h-12 w-12 text-slate-800 mb-4" />
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No Significant clusters detected</p>
              </div>
            )}
          </div>
          <div className="p-6 bg-[#112233]/20 border-t border-slate-800">
             <button className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-white hover:border-slate-600 transition-all">
               Generate Predictive Analysis
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

