import { Brain, Cpu, ShieldCheck, Zap, AlertCircle } from "lucide-react";
import { fetchAIAnalysis } from "../../../lib/queries";

export const dynamic = "force-dynamic";

export default async function AIRecognitionPage() {
  const analysisData = await fetchAIAnalysis();
  
  // Calculate some stats from real data
  const processedCount = analysisData.length;
  const highConfidenceCount = analysisData.filter(d => (d.ai_analysis as any)?.confidence_score > 0.8).length;
  const avgConfidence = processedCount > 0 
    ? (analysisData.reduce((acc, d) => acc + ((d.ai_analysis as any)?.confidence_score || 0), 0) / processedCount * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">AI Recognition</h1>
          <p className="text-inkmuted mt-1">Computer vision and predictive threat analysis</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent border border-accent/20 rounded-lg">
          <Zap className="h-4 w-4 fill-current" />
          <span className="text-sm font-bold uppercase tracking-wider">Neural Engine Active</span>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-surface border border-hairline rounded-xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain className="h-24 w-24" />
          </div>
          <h3 className="text-xl font-bold text-ink mb-4">Detection Metrics</h3>
          <p className="text-inkmuted mb-6">Real-time classification of incidents and behavior patterns across the monitored maritime zones.</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-inkmuted font-medium">Confidence Avg</span>
              <span className="text-accent font-bold">{avgConfidence}%</span>
            </div>
            <div className="h-8 w-px bg-surface2" />
            <div className="flex flex-col">
              <span className="text-inkmuted font-medium">Total Scans</span>
              <span className="text-ink font-bold">{processedCount}</span>
            </div>
            <div className="h-8 w-px bg-surface2" />
            <div className="flex flex-col">
              <span className="text-inkmuted font-medium">High Conf.</span>
              <span className="text-emerald-400 font-bold">{highConfidenceCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-hairline rounded-xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck className="h-24 w-24" />
          </div>
          <h3 className="text-xl font-bold text-ink mb-4">Anomaly Status</h3>
          <p className="text-inkmuted mb-6">Current system health and detection accuracy for behavior-based threat modeling.</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex flex-col">
              <span className="text-inkmuted font-medium">System Health</span>
              <span className="text-emerald-400 font-bold">Optimal</span>
            </div>
            <div className="h-8 w-px bg-surface2" />
            <div className="flex flex-col">
              <span className="text-inkmuted font-medium">Active Models</span>
              <span className="text-ink font-bold">4</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-hairline rounded-xl p-6">
        <h3 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-accent" />
          Analysis Results & Queue
        </h3>
        <div className="space-y-3">
          {analysisData.length > 0 ? (
            analysisData.map((incident) => {
              const ai = incident.ai_analysis as any;
              const isAnalyzing = !ai || ai.confidence_score === 0;
              
              return (
                <div key={incident.id} className="flex items-center justify-between p-4 bg-canvas rounded-lg border border-hairline hover:border-hairline transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-surface2 rounded-md overflow-hidden flex items-center justify-center">
                      {(incident.evidence as any)?.[0]?.image_url ? (
                        <img src={(incident.evidence as any)[0].image_url} alt="Evidence" className="h-full w-full object-cover" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-inkmuted" />
                      )}
                    </div>
                    <div>
                      <p className="text-ink font-medium text-sm capitalize">{incident.type} Detection</p>
                      <p className="text-xs text-inkmuted">
                        {isAnalyzing ? "Processing neural layers..." : `Confidence: ${(ai.confidence_score * 100).toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-1 rounded ${
                      isAnalyzing 
                        ? "bg-accent/10 text-accent animate-pulse" 
                        : ai.threat_level === 'high' || ai.threat_level === 'critical'
                          ? "bg-red-500/10 text-red-400"
                          : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {isAnalyzing ? "In Progress" : ai.threat_level || 'Processed'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-inkmuted border border-dashed border-hairline rounded-lg">
              No incident data available for AI analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
