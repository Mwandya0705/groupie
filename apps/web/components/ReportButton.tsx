"use client";

import { useState } from "react";
import { FileText, Download, X } from "lucide-react";

/**
 * Shows the AI-generated incident report and lets the user download it as a
 * .txt file. Linked to a specific incident by id.
 */
export function ReportButton({ report, incidentId }: { report?: string | null; incidentId: string }) {
  const [open, setOpen] = useState(false);
  if (!report) return <span className="text-inkmuted">—</span>;

  const download = () => {
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incident-report-${incidentId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded-md border border-hairline bg-surface2 px-2 py-1 text-xs font-medium text-ink hover:bg-surface3"
        >
          <FileText className="h-3.5 w-3.5" /> View
        </button>
        <button
          onClick={download}
          className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-white hover:opacity-90"
        >
          <Download className="h-3.5 w-3.5" /> .txt
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl border border-hairline bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-ink">
                <FileText className="h-5 w-5 text-accent" /> Generated Incident Report
              </h3>
              <button onClick={() => setOpen(false)} className="text-inkmuted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-inkmuted">{report}</p>
            <button
              onClick={download}
              className="mt-6 flex items-center gap-2 rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Download className="h-4 w-4" /> Download report (.txt)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
