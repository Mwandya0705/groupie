"use client";

import dynamic from "next/dynamic";
import { useState, useRef } from "react";
import { Clock, MapPin, AlertCircle, ChevronRight } from "lucide-react";

// Dynamically import the incident heatmap
const IncidentHeatmap = dynamic(() => import("./IncidentHeatmap"), { 
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-surface2/20 animate-pulse rounded-3xl border border-hairline" />
});

interface DashboardMapProps {
  incidents: any[];
}

export default function DashboardMap({ incidents }: DashboardMapProps) {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [zoom, setZoom] = useState(10);

  const recentIncidents = incidents.slice(0, 5);
  // Incidents arrive ordered by created_at desc, so index 0 is the latest report.
  const latestIncident = incidents[0];

  const handleIncidentClick = (incident: any) => {
    setSelectedIncidentId(incident.id);
    setMapCenter([incident.latitude, incident.longitude]);
    setZoom(15); // Zoom in on the specific incident
    
    // Scroll map into view if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Expanded Map View */}
      <div className="bg-surface border border-hairline rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
        <div className="absolute bottom-6 left-6 z-20 bg-canvas/90 backdrop-blur-xl border border-hairline/50 px-5 py-3 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-ink uppercase tracking-[0.2em] block">Tactical Oversight</span>
              {latestIncident ? (
                <span className="text-xs text-inkmuted font-medium flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-accent" />
                  Latest incident GPS:{" "}
                  <span className="font-mono text-ink">
                    {latestIncident.latitude.toFixed(5)}, {latestIncident.longitude.toFixed(5)}
                  </span>
                </span>
              ) : (
                <span className="text-xs text-inkmuted font-medium">Awaiting first incident report</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Height increased to 600px and contrast improved */}
        <div className="h-[600px] w-full">
           <IncidentHeatmap 
            incidents={incidents} 
            center={mapCenter} 
            zoom={zoom}
            selectedId={selectedIncidentId}
           />
        </div>
      </div>

      {/* 5 Latest Reported Incidents */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-black text-ink uppercase tracking-[0.15em] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-accent" /> 5 Latest Reported Incidents
        </h3>
        <span className="text-[10px] text-inkmuted font-medium">Tap a card to pinpoint it on the map</span>
      </div>
      <div className="grid gap-4 md:grid-cols-5">
        {recentIncidents.length === 0 && (
          <div className="md:col-span-5 text-center py-8 text-xs text-inkmuted italic border border-dashed border-hairline rounded-2xl">
            No incidents reported yet.
          </div>
        )}
        {recentIncidents.map((incident) => (
          <button
            key={incident.id}
            onClick={() => handleIncidentClick(incident)}
            className={`flex flex-col p-4 rounded-2xl border transition-all duration-300 text-left group ${
              selectedIncidentId === incident.id 
                ? "bg-accent/20 border-accent shadow-[0_0_20px_rgba(20,184,166,0.2)]" 
                : "bg-surface border-hairline hover:border-hairline"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${incident.type.includes('illegal') ? 'bg-red-500/10 text-red-400' : 'bg-accent/10 text-accent'}`}>
                <AlertCircle className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-mono text-inkmuted">
                {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className={`text-xs font-bold capitalize truncate mb-1 ${selectedIncidentId === incident.id ? "text-accent" : "text-ink"}`}>
              {incident.type.replace(/_/g, ' ')}
            </p>
            <p className="text-[10px] text-inkmuted line-clamp-2 mb-2 min-h-[26px]">
              {incident.description || "No description provided."}
            </p>
            <div className="flex items-center gap-1 text-[9px] text-inkmuted">
              <Clock className="h-3 w-3" />
              {new Date(incident.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 text-[9px] text-inkmuted mt-1">
              <MapPin className="h-3 w-3" />
              {incident.latitude.toFixed(2)}, {incident.longitude.toFixed(2)}
            </div>
            <div className="mt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] font-bold text-accent uppercase">Pinpoint</span>
              <ChevronRight className="h-3 w-3 text-accent" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
