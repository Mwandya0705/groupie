"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPanel } from "./MapPanel";
import { 
  Ship, 
  Zap, 
  Maximize2, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { generateAIReport } from "../lib/ai-service";

type Hotspot = {
  coordinates: string;
  count: number;
};

type Props = {
  patrols: any[];
  incidents: any[];
  activeHotspots: Hotspot[];
};

export function DashboardOverview({ patrols, incidents, activeHotspots }: Props) {
  const [focusedLocation, setFocusedLocation] = useState<[number, number] | null>(null);
  const [aiReport, setAiReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'hotspots' | 'vessels'>('hotspots');

  useEffect(() => {
    generateAIReport(incidents).then(setAiReport);
  }, [incidents]);

  const handleSelectHotspot = (coords: string) => {
    const [lat, lng] = coords.split(",").map(c => parseFloat(c.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      setFocusedLocation([lat, lng]);
      if (window.innerWidth < 1024) {
        document.getElementById("surveillance-map")?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-4">
      <div className="lg:col-span-3 space-y-6" id="surveillance-map">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <MapPanel 
            patrols={patrols} 
            incidents={incidents} 
            focusedLocation={focusedLocation} 
          />
        </motion.div>

        {/* AI Analytics Strip */}
        <AnimatePresence mode="wait">
          {aiReport && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-2xl"
            >
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 backdrop-blur-xl border border-blue-500/20">
                    <Sparkles size={28} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                      AI Surveillance Intelligence
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[8px] text-blue-400 border border-blue-500/20">System V3.4</span>
                    </h4>
                    <p className="mt-1 text-xl font-medium text-slate-100 font-sans tracking-tight leading-relaxed max-w-2xl">
                      {aiReport.summary}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col md:items-end gap-3 shrink-0">
                  <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50 pr-4">
                    <span className="text-[10px] uppercase font-bold text-slate-500 px-3 border-r border-slate-800">Threat Level</span>
                    <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${
                      aiReport.threatLevel === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {aiReport.threatLevel}
                    </span>
                  </div>
                  <button className="text-sm font-bold text-blue-500 hover:text-blue-400 transition-all flex items-center gap-2 group">
                    Full Intelligence Feed <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
              
              {/* Abstract Design Elements */}
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/10 blur-[100px]" />
              <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-[100px]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="space-y-6">
        <section className="flex flex-col rounded-[2.5rem] border border-slate-200 bg-white/70 backdrop-blur-3xl p-3 shadow-xl shadow-slate-200/50">
          <div className="flex gap-2 p-1.5 mb-4 bg-slate-100/50 rounded-[2rem] border border-slate-200/50">
            <button 
              onClick={() => setActiveTab('hotspots')}
              className={`flex-1 rounded-[1.5rem] py-3 text-[10px] font-black tracking-widest transition-all ${activeTab === 'hotspots' ? 'bg-white text-slate-950 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              HOTSPOTS
            </button>
            <button 
              onClick={() => setActiveTab('vessels')}
              className={`flex-1 rounded-[1.5rem] py-3 text-[10px] font-black tracking-widest transition-all ${activeTab === 'vessels' ? 'bg-white text-slate-950 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
            >
              VESSELS
            </button>
          </div>

          <div className="px-2 pb-4 overflow-y-auto max-h-[600px] scrollbar-hide">
            {activeTab === 'hotspots' ? (
              <ul className="space-y-4">
                {activeHotspots.length === 0 ? (
                  <li className="py-20 text-center">
                    <Zap size={40} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sky Scan Empty</p>
                  </li>
                ) : null}
                
                {activeHotspots.map((item, idx) => (
                  <motion.li 
                    key={item.coordinates}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <button 
                      onClick={() => handleSelectHotspot(item.coordinates)}
                      className="group relative flex w-full flex-col gap-3 rounded-[2rem] border border-slate-100 bg-white p-5 text-left transition-all hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-200/50 active:scale-[0.97]"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl font-black ${
                          item.count > 1 ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                        }`}>
                          {item.count}
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 w-1.5 rounded-full ${i <= item.count ? (item.count > 1 ? "bg-red-400" : "bg-blue-400") : "bg-slate-100"}`} />
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-black text-slate-900 tracking-tight">Zone Monitoring Pack</p>
                        <p className="mt-1 text-[10px] font-mono font-bold text-slate-400 uppercase">{item.coordinates}</p>
                      </div>

                      <div className="absolute bottom-4 right-5 text-slate-200 group-hover:text-blue-500 transition-colors">
                        <Maximize2 size={18} />
                      </div>
                    </button>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="py-20 text-center space-y-6">
                <div className="mx-auto h-24 w-24 relative flex items-center justify-center rounded-[2.5rem] bg-slate-50 border-8 border-white shadow-xl">
                  <Ship size={32} className="text-slate-400" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-blue-500 border-4 border-white" 
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Global AIS Feed</p>
                  <p className="text-[10px] font-medium text-slate-400 px-6">Scanning authorized vessel registry for sector matches...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-auto p-4 pt-2">
             <div className="flex items-center justify-between rounded-[1.5rem] bg-slate-900 p-4 text-white">
               <div className="flex items-center gap-3">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                 <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">System Status</p>
                   <p className="text-[10px] font-bold">GRID SYNCED</p>
                 </div>
               </div>
               <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
                 <ChevronRight size={16} className="text-slate-400" />
               </div>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
