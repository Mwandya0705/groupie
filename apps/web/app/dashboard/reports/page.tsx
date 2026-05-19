import { fetchDashboardStats } from "../../../lib/queries";
import { 
  BarChart3, 
  Download, 
  FileText, 
  PieChart, 
  TrendingUp, 
  AlertTriangle,
  ChevronDown,
  Calendar
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const stats = await fetchDashboardStats();

  const reportTypes = [
    { name: "Monthly IUU Analysis", description: "Comprehensive breakdown of illegal fishing activity and hotspots.", icon: BarChart3, color: "text-blue-400" },
    { name: "Officer Patrol Efficacy", description: "Performance metrics for active units and sector coverage.", icon: TrendingUp, color: "text-teal-400" },
    { name: "Incident Severity Log", description: "Historical data on violation types and AI detection accuracy.", icon: AlertTriangle, color: "text-red-400" },
    { name: "Fleet Resource Allocation", description: "Visualization of vessel distribution and response times.", icon: PieChart, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Intelligence & Reports</h1>
          <p className="text-slate-400 mt-2 font-medium italic">Advanced Analytics & Strategic Mission Data</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-[#0d1b2a] border border-slate-800 px-4 py-2.5 text-slate-300 font-bold text-xs hover:border-slate-600 transition-all uppercase tracking-widest">
            <Calendar className="h-4 w-4 text-teal-400" />
            Last 30 Days
            <ChevronDown className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-white font-bold text-xs hover:bg-teal-500 transition-all shadow-lg shadow-teal-500/20 uppercase tracking-widest">
            <Download className="h-4 w-4" />
            Generate Global Report
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: "Data Nodes", value: stats.totalIncidents + stats.totalPatrols, sub: "Total captured points" },
          { label: "AI Accuracy", value: "94.2%", sub: "Validation confidence" },
          { label: "System Uptime", value: "99.9%", sub: "Operational status" },
          { label: "Active Sectors", value: "08", sub: "Global coverage" },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0d1b2a] border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <TrendingUp className="h-16 w-16 text-teal-500" />
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
             <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
             <p className="text-xs text-slate-400 mt-2 font-medium">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Report Templates */}
        <div className="bg-[#0d1b2a] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 bg-[#112233]/30">
            <h2 className="font-bold text-white uppercase tracking-tight text-sm">Strategic Templates</h2>
          </div>
          <div className="p-6 space-y-4">
            {reportTypes.map((report, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-800 hover:border-teal-500/30 hover:bg-[#112233]/40 transition-all cursor-pointer group">
                <div className="h-12 w-12 rounded-xl bg-slate-900/50 flex items-center justify-center text-teal-500 border border-slate-800 group-hover:scale-110 transition-transform">
                  <report.icon className={`h-6 w-6 ${report.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-sm group-hover:text-teal-400 transition-colors">{report.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{report.description}</p>
                </div>
                <button className="p-2 text-slate-600 hover:text-white">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Exports */}
        <div className="bg-[#0d1b2a] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 bg-[#112233]/30">
            <h2 className="font-bold text-white uppercase tracking-tight text-sm">Recent Generation Log</h2>
          </div>
          <div className="p-0">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between border-b border-slate-800/50 last:border-0 hover:bg-[#112233]/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">iuu_summary_Q{i+1}_2026.pdf</p>
                    <p className="text-[10px] text-slate-500 font-mono">SIZE: 4.2 MB • GEN: SYSTEM_AUTH</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">2 days ago</span>
              </div>
            ))}
          </div>
          <div className="p-6 text-center border-t border-slate-800">
             <button className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors uppercase tracking-widest">
               View Full Archive
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
