"use client";

import { useState } from "react";
import { Calendar, AlertTriangle, ShieldCheck, Download, FileText, ChevronRight } from "lucide-react";

type Incident = {
  id: string;
  type: string;
  created_at: string;
  latitude: number;
  longitude: number;
  description: string | null;
  ai_analysis: any;
};

type Props = {
  incidents: Incident[];
};

export function TimeframeReports({ incidents }: Props) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | "annually">("monthly");

  // Helper to filter incidents by date range
  const getFilteredIncidents = () => {
    const now = new Date();
    return incidents.filter((i) => {
      const date = new Date(i.created_at);
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (activeTab === "daily") return diffDays <= 1;
      if (activeTab === "weekly") return diffDays <= 7;
      if (activeTab === "monthly") return diffDays <= 30;
      return diffDays <= 365; // Annually
    });
  };

  const filtered = getFilteredIncidents();

  // Calculations
  const totalCount = filtered.length;
  const highThreatCount = filtered.filter(
    (i) =>
      i.ai_analysis?.threat_level === "high" ||
      i.ai_analysis?.threat_level === "critical"
  ).length;

  const totalConfidence = filtered.reduce(
    (acc, i) => acc + (i.ai_analysis?.confidence_score || 0),
    0
  );
  const avgConfidence = totalCount ? (totalConfidence / totalCount) * 100 : 0;

  const typeCounts = filtered.reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] ?? 0) + 1;
    return acc;
  }, {});
  const topViolation = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

  // Generate timeframe descriptive report
  const generateTimeframeDescription = () => {
    const timeframeStr =
      activeTab === "daily" ? "last 24 hours"
      : activeTab === "weekly" ? "last 7 days"
      : activeTab === "monthly" ? "last 30 days"
      : "past calendar year";

    if (totalCount === 0) {
      return `Surveillance telemetry indicates nominal compliance across all tracked zones during the ${timeframeStr}. Patrol vessels and satellite feeds report zero active infractions or blacklisted vessel collisions. Recommended protocol: Maintain routine presence patrols and monitor active sector maps.`;
    }

    const pctTop = Math.round((typeCounts[topViolation] / totalCount) * 100);
    const highThreatPct = Math.round((highThreatCount / totalCount) * 100);

    return `During the ${timeframeStr}, a total of ${totalCount} violations were reported. The primary infraction is classified as "${topViolation}", representing ${pctTop}% of all detected events. AI vision analysis has flagged ${highThreatCount} incident(s) (${highThreatPct}% of total alerts) as critical or high threat levels, validating with an average confidence of ${avgConfidence.toFixed(1)}%. Enforcement actions should prioritize patrols in coordinates where "${topViolation}" is recurring.`;
  };

  // Download timeframe specific CSV
  const downloadTimeframeCSV = () => {
    const filename = `iuu_${activeTab}_report.csv`;
    const headers = [
      "Incident ID",
      "Timestamp",
      "Violation Type",
      "Latitude",
      "Longitude",
      "Description",
      "AI Threat Level",
      "AI Confidence Score",
      "AI Summary"
    ];

    const rows = filtered.map(i => {
      const threat = i.ai_analysis?.threat_level || "N/A";
      const confidence = i.ai_analysis?.confidence_score != null ? `${(i.ai_analysis.confidence_score * 100).toFixed(1)}%` : "N/A";
      const summary = i.ai_analysis?.ai_summary || i.ai_analysis?.report || "N/A";
      
      return [
        i.id,
        new Date(i.created_at).toISOString(),
        i.type,
        i.latitude,
        i.longitude,
        (i.description || "").replace(/"/g, '""'),
        threat,
        confidence,
        summary.replace(/"/g, '""')
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-surface border border-hairline rounded-3xl overflow-hidden shadow-xl">
      {/* Selector Header */}
      <div className="p-6 border-b border-hairline flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface2/30">
        <div>
          <h2 className="font-bold text-ink uppercase tracking-tight text-sm">Surveillance Timeframe Reports</h2>
          <p className="text-xs text-inkmuted mt-0.5">Filter and generate summaries for daily, weekly, monthly, and annual intervals.</p>
        </div>
        <div className="flex bg-surface1 p-1 rounded-xl border border-hairline">
          {(["daily", "weekly", "monthly", "annually"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                activeTab === tab
                  ? "bg-surface3 text-ink shadow-sm"
                  : "text-inkmuted hover:text-ink"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: "Alerts Captured", value: totalCount, sub: "Total incidents logged" },
            { label: "High Threats", value: highThreatCount, sub: "High or critical level" },
            { label: "AI Avg Confidence", value: `${avgConfidence.toFixed(0)}%`, sub: "Computer vision score" },
            { label: "Top Violation", value: topViolation, sub: "Most common infraction" },
          ].map((item, idx) => (
            <div key={idx} className="bg-surface2/50 border border-hairline/60 p-4 rounded-2xl">
              <p className="text-[10px] font-bold text-inkmuted uppercase tracking-wider">{item.label}</p>
              <p className="text-xl font-bold text-ink mt-1 truncate">{item.value}</p>
              <p className="text-[10px] text-inkmuted mt-1 leading-none">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Narrative Description Box */}
        <div className="bg-surface2 border-l-2 border-accent p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            <span className="text-xs font-black text-ink uppercase tracking-widest">Surveillance Intelligence Summary</span>
          </div>
          <p className="text-xs text-inkmuted leading-relaxed font-medium">
            {generateTimeframeDescription()}
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between border-t border-hairline/50 pt-5">
          <span className="text-[10px] text-inkmuted font-mono uppercase">
            REF: {activeTab.toUpperCase()}_SUMMARY_LOG
          </span>
          <button
            onClick={downloadTimeframeCSV}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-ink font-bold text-xs hover:bg-accent/80 transition-all shadow-lg shadow-accent/20 uppercase tracking-widest"
          >
            <Download className="h-3.5 w-3.5" />
            Export {activeTab} CSV
          </button>
        </div>
      </div>
    </div>
  );
}
