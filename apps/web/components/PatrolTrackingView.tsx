"use client";

import dynamic from "next/dynamic";

// Dynamically import the patrol tracking map for client-side only rendering
const PatrolTrackingMap = dynamic(() => import("./PatrolTrackingMap"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-surface2/20 animate-pulse" />
});

interface PatrolTrackingViewProps {
  route: any[];
}

export default function PatrolTrackingView({ route }: PatrolTrackingViewProps) {
  return (
    <div className="h-[600px] w-full bg-surface2 border border-hairline rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="absolute top-6 left-6 z-20 bg-canvas/90 backdrop-blur-xl border border-hairline/50 px-5 py-3 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
          <div className="space-y-0.5">
            <span className="text-[10px] font-black text-ink uppercase tracking-[0.2em] block">Route Visualization</span>
            <span className="text-xs text-inkmuted font-medium">Pathing Data: {route?.length || 0} Points</span>
          </div>
        </div>
      </div>
      <PatrolTrackingMap route={route || []} />
    </div>
  );
}
