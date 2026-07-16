import { fetchProfiles } from "../../../lib/queries";
import { createClient } from "../../../lib/supabase/server";
import { OperatorActions } from "../../../components/OperatorActions";
import { User, Shield, Mail, Calendar, UserPlus, Fingerprint, Activity, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await fetchProfiles();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || "";

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-ink tracking-tight flex items-center gap-4">
            Personnel Registry
            <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              <Activity className="h-3 w-3 text-blue-400" />
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{users.length} Active Profiles</span>
            </div>
          </h1>
          <p className="text-inkmuted mt-2 font-medium italic">Operational Staffing & Administrative Clearance Controls</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-ink font-black text-xs hover:bg-accent transition-all shadow-lg shadow-accent/20 uppercase tracking-widest">
          <UserPlus className="h-4 w-4" />
          Authorize New Operator
        </button>
      </header>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: "Admins", count: users.filter(u => u.role === 'admin').length, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Supervisors", count: users.filter(u => u.role === 'supervisor').length, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Operators", count: users.filter(u => u.role === 'operator').length, color: "text-accent", bg: "bg-accent/10" },
          { label: "Guests", count: users.filter(u => u.role === 'guest').length, color: "text-inkmuted", bg: "bg-surface3/10" },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-hairline p-6 rounded-3xl relative overflow-hidden group">
            <div className={`absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
              <Shield className="h-16 w-16" />
            </div>
            <p className="text-[10px] font-black text-inkmuted uppercase tracking-[0.2em]">{stat.label}</p>
            <p className="text-3xl font-bold text-ink mt-1 tracking-tighter">{stat.count.toString().padStart(2, '0')}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-surface border border-hairline rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-hairline bg-surface2/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-accent" />
            <h2 className="font-bold text-ink uppercase tracking-tight text-sm">Operator Clearance List</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-hairline/50 bg-surface2/20 text-inkmuted text-[10px] uppercase tracking-widest font-black">
                <th className="px-8 py-5">Personnel Data</th>
                <th className="px-8 py-5">Clearance Role</th>
                <th className="px-8 py-5">Assigned Sector</th>
                <th className="px-8 py-5">Last Handshake</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/50">
              {users.map((profile) => (
                <tr key={profile.id} className="hover:bg-surface2/40 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-surface flex items-center justify-center text-inkmuted border border-hairline group-hover:border-accent/50 transition-all">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink group-hover:text-accent transition-colors">{profile.full_name || "Unknown Operator"}</p>
                        <p className="text-[10px] text-inkmuted font-mono">@{profile.username || "not_set"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                      profile.role === 'admin' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      profile.role === 'supervisor' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                      profile.role === 'guest' ? "bg-surface3/10 text-inkmuted border-hairline/20" :
                      "bg-accent/10 text-accent border-accent/20"
                    )}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs text-inkmuted font-bold uppercase tracking-wider">{profile.department || "Field Ops"}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-inkmuted uppercase tracking-widest">
                      <Calendar className="h-3.5 w-3.5 text-accent/50" />
                      {profile.last_login ? new Date(profile.last_login).toLocaleDateString([], { timeZone: 'Africa/Nairobi' }) : "NEVER"}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <OperatorActions profile={profile as any} currentUserId={currentUserId} />
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-inkmuted">
                    <div className="max-w-xs mx-auto">
                      <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-ink" />
                      <p className="font-bold uppercase tracking-widest text-xs">Registry Empty</p>
                      <p className="text-[10px] mt-2 italic text-inkmuted">Personnel will appear after initial deployment.</p>
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

