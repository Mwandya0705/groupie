import { fetchVessels } from "../../../lib/queries";
import { Anchor, ShieldAlert, ShieldCheck } from "lucide-react";
import { RegisterVesselModal } from "../../../components/RegisterVesselModal";
import { SearchInput } from "../../../components/SearchInput";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function VesselsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const q = (resolvedParams.q || "").toLowerCase();
  const vessels = await fetchVessels();

  const filteredVessels = q
    ? vessels.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.registration_number.toLowerCase().includes(q) ||
          (v.vessel_type && v.vessel_type.toLowerCase().includes(q))
      )
    : vessels;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">Vessel Monitoring</h1>
          <p className="text-inkmuted mt-1">Registry of authorized and blacklisted vessels</p>
        </div>
        <RegisterVesselModal />
      </header>

      <SearchInput placeholder="Search vessels by name or registration number..." />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredVessels.map((vessel) => (
          <div key={vessel.id} className="bg-surface border border-hairline rounded-xl p-6 hover:border-hairline transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-surface2 flex items-center justify-center text-inkmuted group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                <Anchor className="h-6 w-6" />
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border",
                vessel.status === 'authorized' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                vessel.status === 'blacklisted' ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                "bg-amber-500/10 text-amber-400 border-amber-500/20"
              )}>
                {vessel.status}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-ink mb-1">{vessel.name}</h3>
            <p className="text-sm text-inkmuted mb-4">{vessel.registration_number}</p>

            <div className="space-y-2 border-t border-hairline pt-4 mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-inkmuted">Type</span>
                <span className="text-inkmuted capitalize">{vessel.vessel_type}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-inkmuted">Last Sighted</span>
                <span className="text-inkmuted">{vessel.last_sighted ? new Date(vessel.last_sighted).toLocaleDateString([], { timeZone: 'Africa/Nairobi' }) : "Never"}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredVessels.length === 0 && (
          <div className="col-span-full bg-surface border border-hairline rounded-xl p-12 text-center">
            <p className="text-inkmuted">No vessels found in registry.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
