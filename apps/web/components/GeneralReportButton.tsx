"use client";

import { useState } from "react";
import { FileBarChart, Download, X, Sparkles, MapPin } from "lucide-react";
import { generateGeneralReport, type GeneralReport, type ReportIncident } from "../lib/report-generator";

/**
 * Generates a general intelligence report from the already-reported incidents
 * (reads their descriptions, finds recurring hotspots, recommends measures) the
 * moment it is clicked, shows a preview, and downloads it as a Word (.doc) or
 * plain-text (.txt) file.
 */
export function GeneralReportButton({ incidents }: { incidents: ReportIncident[] }) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<GeneralReport | null>(null);

  const run = () => {
    setReport(generateGeneralReport(incidents ?? []));
    setOpen(true);
  };

  const downloadDoc = () => {
    if (!report) return;
    const blob = new Blob([report.html], { type: "application/msword;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `IUU-General-Report-${new Date().toISOString().slice(0, 10)}.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadTxt = () => {
    if (!report) return;
    const blob = new Blob([report.text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `IUU-General-Report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <button
        onClick={run}
        className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <FileBarChart className="h-4 w-4" />
        Download General Report
      </button>

      {open && report && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-hairline bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-hairline bg-surface2/40 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">General Intelligence Report</h3>
                  <p className="text-xs text-inkmuted">
                    {report.totalIncidents} incidents analyzed · {report.hotspotCount} recurring hotspot(s) · {report.generatedAt}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-inkmuted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-inkmuted">{report.text}</pre>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-surface2/40 p-4">
              <span className="flex items-center gap-1.5 text-[11px] text-inkmuted">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                Based on currently reported incidents
              </span>
              <div className="flex gap-2">
                <button
                  onClick={downloadTxt}
                  className="flex items-center gap-1.5 rounded-xl border border-hairline bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-surface2"
                >
                  <Download className="h-3.5 w-3.5" /> .txt
                </button>
                <button
                  onClick={downloadDoc}
                  className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" /> Download (.doc)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
