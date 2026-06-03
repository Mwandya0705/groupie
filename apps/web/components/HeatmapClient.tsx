"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so the heatmap must be client-only (no SSR).
// Next 15 only allows `ssr: false` dynamic imports inside a Client Component,
// so this thin wrapper lets server pages (e.g. Hotspot Analytics) render it.
const IncidentHeatmap = dynamic(() => import("./IncidentHeatmap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface2/20" />,
});

export default function HeatmapClient(props: {
  incidents: any[];
  center?: [number, number];
  zoom?: number;
  selectedId?: string | null;
}) {
  return <IncidentHeatmap {...props} />;
}
