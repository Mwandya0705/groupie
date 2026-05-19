"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import for the entire Map component to avoid SSR and hook issues
const MapView = dynamic<any>(() => import("./MapView"), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full animate-pulse rounded-lg bg-slate-100" />
});

export function MapPanel({ patrols, incidents, focusedLocation = null }: any) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Activity & Surveillance Map</h3>
          <p className="text-sm text-slate-500">Visualizing surveillance density, active routes, and incident hotspots</p>
        </div>
        <div className="flex gap-4 text-xs font-medium uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span> Patrols
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500"></span> Incidents
          </span>
        </div>
      </div>

      <div className="h-[550px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <MapView patrols={patrols} incidents={incidents} focusedLocation={focusedLocation} />
      </div>
      
      <div className="mt-4 flex gap-6 text-sm text-slate-600">
        <div className="flex-1 border-r border-slate-100 pr-6">
          <p className="font-semibold text-slate-800">Surveillance Routes</p>
          <p>The blue lines represent exact paths taken by officers. Thicker/darker areas indicate repeated surveillance.</p>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800">Incident Pinpoints</p>
          <p>Red markers identify exact violation locations. Click a marker to see incident details and evidence links.</p>
        </div>
      </div>
    </div>
  );
}
