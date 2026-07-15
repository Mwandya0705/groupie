"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
};

interface PatrolTrackingMapProps {
  route: { latitude: number; longitude: number }[];
}

function MapFit({ route }: { route: { latitude: number; longitude: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (route.length > 0) {
      const bounds = L.latLngBounds(route.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
}

export default function PatrolTrackingMap({ route }: PatrolTrackingMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    fixLeafletIcon();
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="h-full w-full bg-canvas animate-pulse" />;

  const positions: [number, number][] = route.map(p => [p.latitude, p.longitude]);
  const center: [number, number] = positions.length > 0 ? positions[0] : [-1.286389, 36.817223];

  return (
    <div className="h-full w-full relative z-10">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: "100%", width: "100%", background: "#f8fafc" }}
      >
        <TileLayer
          attribution='&copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapFit route={route} />
        <Polyline 
          positions={positions} 
          pathOptions={{ 
            color: '#14b8a6', 
            weight: 4, 
            opacity: 0.8,
            dashArray: '10, 10',
            lineJoin: 'round'
          }} 
        />
        {positions.length > 0 && (
          <>
            <Marker position={positions[0]}>
              <Popup>Start Point</Popup>
            </Marker>
            <Marker position={positions[positions.length - 1]}>
              <Popup>Current/End Position</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}
