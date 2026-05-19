import { fetchAuditLogs } from "../../../lib/queries";
import { 
  History, 
  Search, 
  Terminal, 
  Shield, 
  User, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Filter
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const logs = await fetchAuditLogs();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-4">
            System Audit
            <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          </h1>
          <p className="text-slate-400 mt-2 font-medium italic">Chronological Ledger of Operational Actions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
            <input 
              placeholder="Search by action, user..."
              className="bg-[#0d1b2a] border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:ring-2 focus:ring-teal-500/30 w-64 transition-all"
            />
          </div>
          <button className="bg-[#0d1b2a] border border-slate-800 p-2.5 rounded-xl text-slate-400 hover:text-white transition-colors">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="bg-[#0d1b2a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-[#112233]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-red-500" />
            <h2 className="font-bold text-white uppercase tracking-tight text-sm">Security Ledger</h2>
          </div>
          <button className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-[0.2em] transition-colors border border-red-500/20 px-3 py-1 rounded-full">
            Clear Local Cache
          </button>
        </div>

        <div className="p-0">
          {logs.map((log) => (
            <div key={log.id} className="p-6 border-b border-slate-800/50 last:border-0 hover:bg-[#112233]/40 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5 flex-1">
                <div className="h-12 w-12 rounded-2xl bg-slate-900/50 flex items-center justify-center text-slate-500 border border-slate-800 group-hover:text-red-400 group-hover:border-red-500/30 transition-all">
                  <History className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/5 border border-red-500/20 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-sm font-bold text-white tracking-tight">{log.resource}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Executed by <span className="text-teal-400">@{log.profiles?.username || "SYSTEM"}</span> 
                    {log.details && ` • ${JSON.stringify(log.details).slice(0, 100)}...`}
                  </p>
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      <Layers className="h-3 w-3" />
                      IP: {log.ip_address || "Internal Routing"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 md:text-right">
                <div>
                  <p className="text-sm font-bold text-slate-300">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
                <button className="h-10 w-10 rounded-xl bg-slate-900/50 flex items-center justify-center text-slate-600 hover:text-white border border-slate-800 hover:border-slate-600 transition-all">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="p-20 text-center">
               <Shield className="h-16 w-16 text-slate-900 mx-auto mb-4" />
               <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Awaiting Security Events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
