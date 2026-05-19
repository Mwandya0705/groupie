import { fetchVessels } from "../../../lib/queries";
import { Anchor, ShieldAlert, ShieldCheck, Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VesselsPage() {
  const vessels = await fetchVessels();

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vessel Monitoring</h1>
          <p className="text-slate-400 mt-1">Registry of authorized and blacklisted vessels</p>
        </div>
        <button className="rounded-lg bg-teal-600 px-4 py-2 text-white font-medium hover:bg-teal-500 transition-colors">
          Register Vessel
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <input 
          className="w-full rounded-xl border border-slate-800 bg-[#0d1b2a] pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
          placeholder="Search vessels by name or registration number..." 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vessels.map((vessel) => (
          <div key={vessel.id} className="bg-[#0d1b2a] border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-teal-500/10 group-hover:text-teal-400 transition-colors">
                <Anchor className="h-6 w-6" />
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border",
                vessel.status === 'authorized' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                vessel.status === 'blacklisted' ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                {vessel.status}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-1">{vessel.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{vessel.registration_number}</p>

            <div className="space-y-2 border-t border-slate-800 pt-4 mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Type</span>
                <span className="text-slate-300 capitalize">{vessel.vessel_type}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Last Sighted</span>
                <span className="text-slate-300">{vessel.last_sighted ? new Date(vessel.last_sighted).toLocaleDateString() : "Never"}</span>
              </div>
            </div>
          </div>
        ))}

        {vessels.length === 0 && (
          <div className="col-span-full bg-[#0d1b2a] border border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-400">No vessels found in registry.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
