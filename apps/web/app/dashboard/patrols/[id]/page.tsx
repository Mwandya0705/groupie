import { createClient } from "../../../../lib/supabase/server";
import { ChevronLeft, Clock, MapPin, User, Shield, Calendar } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PatrolTrackingView from "../../../../components/PatrolTrackingView";

export const dynamic = "force-dynamic";

export default async function PatrolDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: patrol, error } = await supabase
    .from("patrols")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !patrol) {
    console.error("Patrol fetch error:", error);
    return notFound();
  }

  // Fetch profile separately to avoid join issues
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, role")
    .eq("id", patrol.user_id)
    .single();

  const officerName = profile?.role === 'guest' ? "Guest" : (profile?.full_name || "Unknown Officer");

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col gap-4">
        <Link 
          href="/dashboard/patrols" 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit group"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Patrols</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${patrol.end_time ? 'bg-slate-800 text-slate-400' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'}`}>
                {patrol.end_time ? 'Completed' : 'Active Tracking'}
              </span>
              <span className="text-slate-600 font-mono text-xs">#{patrol.id.slice(0, 8)}</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter capitalize">{patrol.patrol_type} Patrol Analysis</h1>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-6">
          <PatrolTrackingView route={patrol.route || []} />
        </div>

        {/* Sidebar Info Section */}
        <div className="space-y-6">
          <div className="bg-[#0d1b2a] border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h2 className="font-bold text-white mb-8 text-lg border-b border-slate-800 pb-4">Patrol Metadata</h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assigned Officer</p>
                  <p className="text-lg font-bold text-white">{officerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Start Time</p>
                  <p className="text-sm font-bold text-white">{new Date(patrol.start_time).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Duration</p>
                  <p className="text-sm font-bold text-white">
                    {patrol.end_time 
                      ? `${Math.round((new Date(patrol.end_time).getTime() - new Date(patrol.start_time).getTime()) / 60000)} Minutes`
                      : "Ongoing"
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Coordinates Captured</p>
                  <p className="text-sm font-bold text-white">{patrol.route?.length || 0} GPS Nodes</p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-800">
              <button className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98]">
                Export Route Log (CSV)
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#112233] to-[#060e17] border border-slate-800 rounded-3xl p-6 text-center">
             <Shield className="h-12 w-12 text-teal-500 mx-auto mb-4 opacity-50" />
             <p className="text-xs text-slate-400 leading-relaxed italic">
               "This tracking data is encrypted and stored according to maritime surveillance protocols."
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
