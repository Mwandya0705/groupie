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

function UserLocationTracker() {
  const map = useMap();
  
  useEffect(() => {
    // Locate the user but DO NOT override the view (setView: false)
    // This allows the patrol route to remain the primary focus.
    map.locate({ setView: false, maxZoom: 15 });

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

export default function PatrolTrackingMap({ route }: PatrolTrackingMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    fixLeafletIcon();
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="h-full w-full bg-[#060e17] animate-pulse" />;

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
        <UserLocationTracker />
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
