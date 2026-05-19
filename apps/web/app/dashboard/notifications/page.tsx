import { 
  Bell, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Trash2, 
  MoreVertical,
  MailOpen,
  MessageSquare
} from "lucide-react";

export default function NotificationsPage() {
  const notifications = [
    { type: 'alert', title: 'Critical Hotspot Detected', desc: 'AI confidence exceeded 95% in Sector Water-04. Potential illegal vessel proximity.', time: '12m ago', read: false },
    { type: 'success', title: 'System Backup Complete', desc: 'Global sync registry has been successfully backed up to the secure cloud vault.', time: '1h ago', read: true },
    { type: 'info', title: 'Maintenance Protocol', desc: 'Scheduled maintenance for the Edge Pipeline in 24 hours. Minimal downtime expected.', time: '3h ago', read: false },
    { type: 'message', title: 'Director Message', desc: 'Please review the quarterly surveillance efficacy report for the East African corridor.', time: '5h ago', read: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-4">
            Communications
            <div className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-[10px] font-black text-white">2</span>
            </div>
          </h1>
          <p className="text-slate-400 mt-2 font-medium italic">Operational Alerts & Strategic Feed</p>
        </div>
        <button className="text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Clear All
        </button>
      </header>

      <div className="space-y-4">
        {notifications.map((n, i) => (
          <div 
            key={i} 
            className={`bg-[#0d1b2a] border rounded-3xl p-6 flex items-start gap-5 transition-all group relative overflow-hidden ${
              n.read ? 'border-slate-800 opacity-60' : 'border-teal-500/30 shadow-lg shadow-teal-500/5'
            }`}
          >
            {/* Status Indicator */}
            {!n.read && (
              <div className="absolute top-0 right-0 p-4">
                <div className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
              </div>
            )}

            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 ${
              n.type === 'alert' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              n.type === 'success' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
              n.type === 'message' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              'bg-slate-500/10 text-slate-400 border-slate-800'
            }`}>
              {n.type === 'alert' ? <AlertCircle className="h-6 w-6" /> :
               n.type === 'success' ? <CheckCircle2 className="h-6 w-6" /> :
               n.type === 'message' ? <MessageSquare className="h-6 w-6" /> :
               <Info className="h-6 w-6" />}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className={`font-bold text-lg ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.title}</h3>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{n.time}</span>
              </div>
              <p className={`text-sm leading-relaxed max-w-2xl ${n.read ? 'text-slate-500' : 'text-slate-400'}`}>
                {n.desc}
              </p>
              
              <div className="flex items-center gap-6 mt-4">
                <button className="text-[10px] font-black text-teal-400 hover:text-teal-300 uppercase tracking-[0.2em] transition-colors flex items-center gap-2">
                  <MailOpen className="h-3 w-3" /> Mark as Read
                </button>
                <button className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors">
                  Archive Alert
                </button>
              </div>
            </div>

            <button className="p-2 text-slate-800 hover:text-slate-400 transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        ))}

        <div className="p-10 border-2 border-dashed border-slate-800 rounded-3xl text-center">
           <Bell className="h-10 w-10 text-slate-800 mx-auto mb-4" />
           <p className="text-slate-600 text-xs font-bold uppercase tracking-widest italic">No older notifications in archive</p>
        </div>
      </div>
    </div>
  );
}
