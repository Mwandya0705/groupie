"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

interface HeatmapProps {
  incidents: any[];
  center?: [number, number];
  zoom?: number;
  selectedId?: string | null;
}

function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    // @ts-ignore
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      gradient: { 0.4: "blue", 0.6: "cyan", 0.7: "lime", 0.8: "yellow", 1: "red" },
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}

function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function IncidentHeatmap({ incidents, center: propCenter, zoom: propZoom, selectedId }: HeatmapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    fixLeafletIcon();
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="h-full w-full bg-canvas" />;

  const heatPoints: [number, number, number][] = incidents.map((inc) => [
    inc.latitude,
    inc.longitude,
    1, // Intensity
  ]);

  const defaultCenter: [number, number] = incidents.length > 0 
    ? [incidents[0].latitude, incidents[0].longitude] 
    : [-1.286389, 36.817223];

  return (
    <div className="h-full w-full relative z-10">
      <MapContainer 
        center={defaultCenter} 
        zoom={10} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%", background: "#f8fafc" }}
      >
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapController center={propCenter} zoom={propZoom} />
        <HeatLayer points={heatPoints} />
        {incidents.map((incident) => (
          <Marker 
            key={incident.id} 
            position={[incident.latitude, incident.longitude]}
            opacity={selectedId === incident.id ? 1 : 0.6}
          >
            <Popup>
              <div className="p-2">
                <p className="font-bold text-ink capitalize">{incident.type.replace('_', ' ')}</p>
                <p className="text-xs text-inkmuted">{incident.description}</p>
                <p className="text-[10px] text-inkmuted mt-1">{new Date(incident.created_at).toLocaleDateString()}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
