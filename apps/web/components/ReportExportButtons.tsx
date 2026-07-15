"use client";

import { Download } from "lucide-react";

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
  label?: string;
  variant?: "global" | "template";
  filterType?: string;
};

export function ReportExportButtons({ incidents, label = "Generate Global Report", variant = "global", filterType }: Props) {
  const exportToCSV = () => {
    let targetData = incidents;
    let filename = "iuu_global_report.csv";

    if (filterType) {
      targetData = incidents.filter(i => i.type.toLowerCase().includes(filterType.toLowerCase()));
      filename = `iuu_${filterType.toLowerCase().replace(/ /g, "_")}_report.csv`;
    }

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

    const rows = targetData.map(i => {
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

  if (variant === "template") {
    return (
      <button onClick={exportToCSV} className="p-2 text-inkmuted hover:text-ink" title="Download Report">
        <Download className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={exportToCSV}
      className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-ink font-bold text-xs hover:bg-accent/80 transition-all shadow-lg shadow-accent/20 uppercase tracking-widest"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}
