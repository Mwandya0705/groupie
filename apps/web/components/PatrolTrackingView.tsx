"use client";

import dynamic from "next/dynamic";

// Dynamically import the patrol tracking map for client-side only rendering
const PatrolTrackingMap = dynamic(() => import("./PatrolTrackingMap"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-800/20 animate-pulse" />
});

interface PatrolTrackingViewProps {
  route: any[];
}

export default function PatrolTrackingView({ route }: PatrolTrackingViewProps) {
  return (
    <div className="h-[600px] w-full bg-slate-100 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="absolute top-6 left-6 z-20 bg-[#060e17]/90 backdrop-blur-xl border border-slate-700/50 px-5 py-3 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] block">Route Visualization</span>
            <span className="text-xs text-slate-400 font-medium">Pathing Data: {route?.length || 0} Points</span>
          </div>
        </div>
      </div>
      <PatrolTrackingMap route={route || []} />
    </div>
  );
}
