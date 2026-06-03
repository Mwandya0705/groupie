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
          <h1 className="text-4xl font-extrabold text-ink tracking-tight flex items-center gap-4">
            System Audit
            <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          </h1>
          <p className="text-inkmuted mt-2 font-medium italic">Chronological Ledger of Operational Actions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-inkmuted" />
            <input 
              placeholder="Search by action, user..."
              className="bg-surface border border-hairline rounded-xl py-2.5 pl-10 pr-4 text-sm text-ink placeholder-inkmuted outline-none focus:ring-2 focus:ring-accent/30 w-64 transition-all"
            />
          </div>
          <button className="bg-surface border border-hairline p-2.5 rounded-xl text-inkmuted hover:text-ink transition-colors">
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="bg-surface border border-hairline rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-hairline bg-surface2/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-red-500" />
            <h2 className="font-bold text-ink uppercase tracking-tight text-sm">Security Ledger</h2>
          </div>
          <button className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-[0.2em] transition-colors border border-red-500/20 px-3 py-1 rounded-full">
            Clear Local Cache
          </button>
        </div>

        <div className="p-0">
          {logs.map((log) => (
            <div key={log.id} className="p-6 border-b border-hairline/50 last:border-0 hover:bg-surface2/40 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-5 flex-1">
                <div className="h-12 w-12 rounded-2xl bg-surface/50 flex items-center justify-center text-inkmuted border border-hairline group-hover:text-red-400 group-hover:border-red-500/30 transition-all">
                  <History className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/5 border border-red-500/20 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-sm font-bold text-ink tracking-tight">{log.resource}</span>
                  </div>
                  <p className="text-xs text-inkmuted leading-relaxed font-medium">
                    Executed by <span className="text-accent">@{log.profiles?.username || "SYSTEM"}</span> 
                    {log.details && ` • ${JSON.stringify(log.details).slice(0, 100)}...`}
                  </p>
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-inkmuted uppercase tracking-widest">
                      <Layers className="h-3 w-3" />
                      IP: {log.ip_address || "Internal Routing"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 md:text-right">
                <div>
                  <p className="text-sm font-bold text-inkmuted">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-[10px] text-inkmuted font-bold uppercase tracking-widest mt-0.5">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
                <button className="h-10 w-10 rounded-xl bg-surface/50 flex items-center justify-center text-inkmuted hover:text-ink border border-hairline hover:border-hairline transition-all">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="p-20 text-center">
               <Shield className="h-16 w-16 text-ink mx-auto mb-4" />
               <p className="text-inkmuted font-bold uppercase tracking-widest text-xs">Awaiting Security Events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
