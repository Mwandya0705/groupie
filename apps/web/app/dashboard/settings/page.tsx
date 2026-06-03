import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Cpu, 
  Cloud,
  ChevronRight,
  Database,
  Lock
} from "lucide-react";

export default function SettingsPage() {
  const sections = [
    {
      title: "System Parameters",
      icon: Cpu,
      items: [
        { name: "Global Alert Sensitivity", desc: "Adjust AI confidence thresholds for incident flagging.", value: "HIGH" },
        { name: "Live Feed Buffer", desc: "Time delay for real-time surveillance processing.", value: "250ms" },
        { name: "Regional Node", desc: "Primary data center for metadata storage.", value: "East-01" },
      ]
    },
    {
      title: "Security & Access",
      icon: Lock,
      items: [
        { name: "Multi-Factor Protocol", desc: "Mandatory biometric or hardware key authentication.", value: "ENABLED" },
        { name: "Session Termination", desc: "Automatic logout after periods of operational inactivity.", value: "30min" },
        { name: "API Encryption", desc: "Standard for data transmission between edge and cloud.", value: "AES-256" },
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-5xl">
      <header>
        <h1 className="text-4xl font-extrabold text-ink tracking-tight">Core Configuration</h1>
        <p className="text-inkmuted mt-2 font-medium italic">Environmental Tuning & Administrative Controls</p>
      </header>

      <div className="grid gap-8 md:grid-cols-4">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          {[
            { label: "Operational", icon: Settings, active: true },
            { label: "Profiles", icon: User },
            { label: "Notifications", icon: Bell },
            { label: "Privacy", icon: Shield },
            { label: "Network", icon: Globe },
          ].map((item, i) => (
            <button 
              key={i}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                item.active 
                  ? "bg-accent text-ink shadow-lg shadow-accent/20" 
                  : "text-inkmuted hover:text-inkmuted hover:bg-surface2/40"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-8">
          {sections.map((section, i) => (
            <div key={i} className="bg-surface border border-hairline rounded-3xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-hairline bg-surface2/30 flex items-center gap-3">
                <section.icon className="h-5 w-5 text-accent" />
                <h2 className="font-bold text-ink uppercase tracking-tight text-sm">{section.title}</h2>
              </div>
              <div className="divide-y divide-hairline/50">
                {section.items.map((item, j) => (
                  <div key={j} className="p-6 flex items-center justify-between hover:bg-surface2/20 transition-all cursor-pointer group">
                    <div className="flex-1 pr-8">
                      <p className="text-sm font-bold text-ink group-hover:text-accent transition-colors">{item.name}</p>
                      <p className="text-xs text-inkmuted mt-1 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-inkmuted bg-surface px-3 py-1.5 rounded-lg border border-hairline uppercase tracking-widest">
                        {item.value}
                      </span>
                      <ChevronRight className="h-4 w-4 text-ink group-hover:text-ink group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Danger Zone */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
             <div className="flex items-center gap-4 mb-4">
               <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                 <Database className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-bold text-red-500">Infrastructure Purge</h3>
             </div>
             <p className="text-sm text-inkmuted mb-6 leading-relaxed">
               Permanently delete all historical logs, cache artifacts, and operational metadata. This action is irreversible and requires multi-stage clearance.
             </p>
             <button className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-ink transition-all">
               Initialize Purge
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
