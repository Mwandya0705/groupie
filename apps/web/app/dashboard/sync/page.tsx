import { fetchSyncLogs } from "../../../lib/queries";
import { 
  RefreshCw, 
  Database, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Activity,
  Signal,
  ArrowUpRight
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SyncMonitorPage() {
  const syncLogs = await fetchSyncLogs();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-ink tracking-tight flex items-center gap-4">
            Sync Monitoring
            <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-3 py-1 rounded-full">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] text-accent font-bold uppercase tracking-widest">Pipeline: Active</span>
            </div>
          </h1>
          <p className="text-inkmuted mt-2 font-medium italic">Data Persistence & Mobile Edge Synchronization</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-surface border border-hairline px-5 py-2.5 text-inkmuted font-bold text-xs hover:border-hairline transition-all uppercase tracking-widest group">
          <RefreshCw className="h-4 w-4 text-accent group-hover:rotate-180 transition-transform duration-700" />
          Refresh Registry
        </button>
      </header>

      {/* Sync Health Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Successful Syncs", value: "1,284", icon: CheckCircle2, color: "text-accent", bg: "bg-accent/10" },
          { label: "Failed Transfers", value: "02", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "Avg Latency", value: "120ms", icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-hairline p-8 rounded-3xl relative overflow-hidden">
             <stat.icon className={`absolute -right-4 -bottom-4 h-24 w-24 ${stat.color} opacity-5`} />
             <p className="text-[10px] font-black text-inkmuted uppercase tracking-[0.2em]">{stat.label}</p>
             <p className="text-4xl font-bold text-ink mt-1 tracking-tighter">{stat.value}</p>
             <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-inkmuted">
               <ArrowUpRight className="h-3 w-3 text-accent" />
               +12.5% from last period
             </div>
          </div>
        ))}
      </div>

      {/* Sync Logs Table */}
      <div className="bg-surface border border-hairline rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-hairline bg-surface2/30 flex items-center justify-between">
          <h2 className="font-bold text-ink uppercase tracking-tight text-sm">Real-time Transfer Log</h2>
          <div className="flex items-center gap-2 text-[10px] font-bold text-inkmuted uppercase tracking-[0.2em]">
            <Signal className="h-3 w-3 text-accent" /> Live Stream
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-hairline/50 text-inkmuted text-[10px] uppercase tracking-widest font-black">
                <th className="px-8 py-5">Origin / Device</th>
                <th className="px-8 py-5">Protocol / Status</th>
                <th className="px-8 py-5">Payload Density</th>
                <th className="px-8 py-5">Last Handshake</th>
                <th className="px-8 py-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/50">
              {syncLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface2/40 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-surface/50 flex items-center justify-center text-inkmuted border border-hairline group-hover:scale-110 transition-transform">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink">{log.profiles?.full_name || "Unknown Operator"}</p>
                        <p className="text-[10px] text-inkmuted font-mono">ID: {log.device_id || "EDGE-DEVICE-01"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${log.status === 'success' ? 'bg-accent shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'bg-red-500'}`} />
                      <span className={`text-[11px] font-black uppercase tracking-widest ${log.status === 'success' ? 'text-accent' : 'text-red-400'}`}>
                        {log.status === 'success' ? 'Synchronized' : 'Transfer Halted'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4 text-inkmuted" />
                      <span className="text-sm text-inkmuted font-medium">{log.records_synced} Objects Encrypted</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs text-inkmuted font-medium">
                      <Clock className="h-4 w-4 text-accent/50" />
                      {new Date(log.last_sync_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-[10px] font-black text-inkmuted hover:text-ink uppercase tracking-[0.2em] transition-colors">
                      View Payload
                    </button>
                  </td>
                </tr>
              ))}

              {syncLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                       <RefreshCw className="h-12 w-12 text-ink animate-spin-slow mb-4" />
                       <p className="text-inkmuted font-medium italic">Awaiting connection from field devices...</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
