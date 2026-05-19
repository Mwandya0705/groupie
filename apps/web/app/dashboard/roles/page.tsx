import { fetchUserRoles } from "../../../lib/queries";
import { 
  ShieldCheck, 
  Lock, 
  Plus, 
  Settings2, 
  UserCircle, 
  Key,
  ShieldAlert,
  ChevronRight
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const roles = await fetchUserRoles();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-4">
            Roles & Governance
            <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full font-mono uppercase tracking-widest">
              Security Protocol: High
            </span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium italic">Identity & Access Management (IAM) Configuration</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-white font-bold text-xs hover:bg-teal-500 transition-all shadow-lg shadow-teal-500/20 uppercase tracking-widest">
          <Plus className="h-4 w-4" />
          Define New Role
        </button>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Role Cards */}
        {roles.map((role) => (
          <div key={role.id} className="bg-[#0d1b2a] border border-slate-800 rounded-3xl p-8 flex flex-col hover:border-teal-500/30 transition-all group shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="h-14 w-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <button className="p-2 text-slate-600 hover:text-white transition-colors">
                <Settings2 className="h-5 w-5" />
              </button>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">{role.name}</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 italic">
              "Assigned to {role.name === 'System Administrator' ? 'core infrastructure leads' : 'field operational staff'} for platform management."
            </p>

            <div className="space-y-3 mt-auto">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Lock className="h-3 w-3" /> Enabled Capabilities
              </p>
              {role.permissions?.map((perm: string) => (
                <div key={perm} className="flex items-center gap-3 py-2 px-3 bg-[#060e17] rounded-xl border border-slate-800/50">
                   <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                   <span className="text-[11px] font-mono text-slate-300">{perm}</span>
                </div>
              ))}
              {(!role.permissions || role.permissions.length === 0) && (
                <p className="text-xs text-slate-600 italic">No permissions assigned.</p>
              )}
            </div>
          </div>
        ))}

        {/* Global Security Controls */}
        <div className="lg:col-span-3 space-y-6 mt-4">
          <div className="bg-gradient-to-br from-[#112233] to-[#0d1b2a] border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-2xl shadow-red-500/10">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">Emergency Lockdown Protocol</h4>
                <p className="text-sm text-slate-500 mt-1">Instantly revoke all session tokens and force MFA re-authentication for all users.</p>
              </div>
            </div>
            <button className="px-8 py-4 rounded-2xl border-2 border-red-500/30 text-red-500 font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all text-sm">
              Activate Lockdown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
