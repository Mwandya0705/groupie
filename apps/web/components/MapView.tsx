"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, useMap, Polyline, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// Fixing Leaflet default icon issue in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

type Patrol = {
  id: string;
  patrol_type: string;
  route: Array<{ latitude: number; longitude: number; timestamp: string }>;
};

type Incident = {
  id: string;
  type: string;
  latitude: number;
  longitude: number;
};

type Props = {
  patrols: Patrol[];
  incidents: Incident[];
};

function HeatMapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    // @ts-ignore
    const heat = L.heatLayer(points, {
      radius: 35, // Increased radius to make single points larger
      blur: 20,
      minOpacity: 0.5, // Ensure single points are visible
      maxZoom: 17,
      gradient: { 0.2: "blue", 0.4: "cyan", 0.6: "lime", 0.8: "yellow", 1: "red" }
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}

function MapController({ focusedLocation }: { focusedLocation: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (focusedLocation) {
      map.flyTo(focusedLocation, 15, { animate: true, duration: 1.5 });
    }
  }, [map, focusedLocation]);

  return null;
}

function UserLocationTracker() {
  const map = useMap();
  
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 15 });

    const onLocationFound = (e: L.LocationEvent) => {
      L.circle(e.latlng, { radius: e.accuracy / 2, color: '#3b82f6', fillOpacity: 0.1 }).addTo(map);
      L.marker(e.latlng, {
        icon: L.divIcon({
          className: 'bg-blue-500 w-4 h-4 rounded-full border-2 border-white shadow-lg shadow-blue-500/50',
          iconSize: [16, 16]
        })
      }).addTo(map);
    };

    map.on('locationfound', onLocationFound);
    return () => { map.off('locationfound', onLocationFound); };
  }, [map]);

  return null;
}

export default function MapView({ patrols, incidents, focusedLocation = null }: Props & { focusedLocation?: [number, number] | null }) {
  const heatPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    patrols.forEach(p => p.route?.forEach(r => points.push([r.latitude, r.longitude, 0.4])));
    incidents.forEach(i => points.push([i.latitude, i.longitude, 1.0]));
    return points;
  }, [patrols, incidents]);

  const defaultCenter: [number, number] = heatPoints.length > 0 
    ? [heatPoints[0][0], heatPoints[0][1]] 
    : [0, 0];

  return (
    <MapContainer center={defaultCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <UserLocationTracker />
      
      {/* Centering Control */}
      <MapController focusedLocation={focusedLocation} />

      {/* Heatmap Layer */}
      <HeatMapLayer points={heatPoints} />

      {/* Patrol Routes (Polylines) */}
      {patrols.map((patrol) => (
        <Polyline 
          key={patrol.id}
          positions={patrol.route?.map(r => [r.latitude, r.longitude]) || []}
          pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.6 }}
        />
      ))}

      {/* Incident Markers */}
      {incidents.map((incident) => (
        <Marker 
          key={incident.id} 
          position={[incident.latitude, incident.longitude]}
        >
          <Popup>
            <div className="p-1">
              <p className="font-bold text-slate-900">{incident.type}</p>
              <p className="text-xs text-slate-500">
                Coords: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
              </p>
              <a 
                href={`/dashboard`} 
                className="mt-2 block text-xs font-semibold text-blue-600 hover:underline"
              >
                View in Reports Table
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
