"use client";

import dynamic from "next/dynamic";
import { useState, useRef } from "react";
import { Clock, MapPin, AlertCircle, ChevronRight } from "lucide-react";

// Dynamically import the incident heatmap
const IncidentHeatmap = dynamic(() => import("./IncidentHeatmap"), { 
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-slate-800/20 animate-pulse rounded-3xl border border-slate-800" />
});

interface DashboardMapProps {
  incidents: any[];
}

export default function DashboardMap({ incidents }: DashboardMapProps) {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [zoom, setZoom] = useState(10);

  const recentIncidents = incidents.slice(0, 5);

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
      <div className="bg-[#0d1b2a] border border-slate-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
        <div className="absolute bottom-6 left-6 z-20 bg-[#060e17]/90 backdrop-blur-xl border border-slate-700/50 px-5 py-3 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] block">Tactical Oversight</span>
              <span className="text-xs text-slate-400 font-medium">Live GPS Stream Active</span>
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

      {/* Interactive Recent Incidents Panel */}
      <div className="grid gap-4 md:grid-cols-5">
        {recentIncidents.map((incident) => (
          <button
            key={incident.id}
            onClick={() => handleIncidentClick(incident)}
            className={`flex flex-col p-4 rounded-2xl border transition-all duration-300 text-left group ${
              selectedIncidentId === incident.id 
                ? "bg-teal-500/20 border-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.2)]" 
                : "bg-[#0d1b2a] border-slate-800 hover:border-slate-600"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${incident.type.includes('illegal') ? 'bg-red-500/10 text-red-400' : 'bg-teal-500/10 text-teal-400'}`}>
                <AlertCircle className="h-4 w-4" />
              </div>
              <span className="text-[9px] font-mono text-slate-500">
                {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className={`text-xs font-bold truncate mb-1 ${selectedIncidentId === incident.id ? "text-teal-400" : "text-white"}`}>
              {incident.type.replace('_', ' ')}
            </p>
            <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-auto">
              <MapPin className="h-3 w-3" />
              {incident.latitude.toFixed(2)}, {incident.longitude.toFixed(2)}
            </div>
            <div className="mt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] font-bold text-teal-500 uppercase">Pinpoint</span>
              <ChevronRight className="h-3 w-3 text-teal-500" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
