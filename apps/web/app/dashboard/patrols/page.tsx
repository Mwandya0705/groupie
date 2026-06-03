import { fetchPatrolRoutes } from "../../../lib/queries";
import { MapPin, Clock, Shield, Filter, LayoutGrid, Waves, Mountain, ChevronRight } from "lucide-react";
import Link from "next/link";
import Pagination from "../../../components/Pagination";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ 
    page?: string; 
    sector?: string;
  }>;
}

export default async function PatrolsPage({ searchParams }: PageProps) {
  const { page: pageStr, sector = "all" } = await searchParams;
  const page = parseInt(pageStr || "1");
  const limit = 6;

  const { data: patrols, totalPages, total } = await fetchPatrolRoutes({
    page,
    limit,
    type: sector,
    sortBy: 'start_time',
    order: 'desc'
  });

  const sectors = [
    { id: "all", label: "All Sectors", icon: LayoutGrid },
    { id: "water", label: "Water Sector", icon: Waves },
    { id: "land", label: "Land Sector", icon: Mountain },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-ink tracking-tight flex items-center gap-3">
            Live Patrols
            <span className="text-xs bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full font-mono">
              {total} Total
            </span>
          </h1>
          <p className="text-inkmuted mt-2 font-medium italic">Command Oversight & Tactical Deployment Stream</p>
        </div>
        
        <div className="flex bg-surface p-1 rounded-2xl border border-hairline">
          {sectors.map((s) => {
            const Icon = s.icon;
            const isActive = sector === s.id;
            return (
              <Link
                key={s.id}
                href={`?sector=${s.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? "bg-accent text-ink shadow-lg" 
                    : "text-inkmuted hover:text-inkmuted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </Link>
            );
          })}
        </div>
      </header>

      <div className="grid gap-6">
        {patrols.map((patrol) => (
          <div 
            key={patrol.id} 
            className="group bg-surface border border-hairline rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-accent/30 hover:bg-surface2/40 transition-all duration-500 shadow-xl relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-3xl ${
              patrol.patrol_type === 'water' ? 'bg-blue-500' : 'bg-emerald-500'
            }`} />

            <div className="flex items-center gap-5 relative z-10">
              <div className={cn(
                "h-16 w-16 rounded-2xl flex items-center justify-center border-2 transition-transform group-hover:scale-110",
                patrol.patrol_type === 'water' 
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}>
                {patrol.patrol_type === 'water' ? <Waves className="h-8 w-8" /> : <Shield className="h-8 w-8" />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-ink capitalize tracking-tight group-hover:text-accent transition-colors">
                  {patrol.patrol_type} Sector Patrol
                </h3>
                <p className="text-xs text-inkmuted font-mono mt-1">UNIT REF: {patrol.id.slice(0, 12).toUpperCase()}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-12 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-surface/50 flex items-center justify-center border border-hairline">
                  <Clock className="h-5 w-5 text-inkmuted" />
                </div>
                <div>
                  <p className="text-[10px] text-inkmuted uppercase font-black tracking-widest">Start Time</p>
                  <p className="text-sm text-ink font-medium">{new Date(patrol.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-surface/50 flex items-center justify-center border border-hairline">
                  <MapPin className="h-5 w-5 text-inkmuted" />
                </div>
                <div>
                  <p className="text-[10px] text-inkmuted uppercase font-black tracking-widest">Operation Status</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`h-2 w-2 rounded-full ${patrol.end_time ? 'bg-surface3' : 'bg-accent animate-pulse'}`} />
                    <p className={`text-sm font-bold ${patrol.end_time ? "text-inkmuted" : "text-accent"}`}>
                      {patrol.end_time ? "Protocol Concluded" : "Live - Intercepting"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Link 
              href={`/dashboard/patrols/${patrol.id}`}
              className="px-6 py-3 rounded-2xl bg-canvas border border-hairline text-inkmuted hover:text-ink hover:bg-accent hover:border-accent transition-all text-sm font-bold shadow-lg flex items-center gap-2 group/btn"
            >
              Analyze Route
              <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        ))}

        {patrols.length === 0 && (
          <div className="bg-surface border border-hairline rounded-3xl p-20 text-center shadow-inner">
            <div className="inline-flex h-20 w-20 rounded-full bg-surface/50 items-center justify-center mb-6">
              <Shield className="h-10 w-10 text-ink" />
            </div>
            <p className="text-inkmuted font-medium">No surveillance units detected in the {sector} sector.</p>
          </div>
        )}
      </div>

      <Pagination totalPages={totalPages} currentPage={page} />
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
