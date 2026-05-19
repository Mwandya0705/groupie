import { IncidentsTable } from "../../../components/IncidentsTable";
import { fetchDashboardStats } from "../../../lib/queries";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string;
  date?: string;
};

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;
  const stats = await fetchDashboardStats();

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Incident Management</h1>
          <p className="text-slate-400 mt-1">Review and manage reported violations</p>
        </div>
      </header>

      <form className="grid gap-4 rounded-xl border border-slate-800 bg-[#0d1b2a] p-4 md:grid-cols-3" method="GET">
        <input 
          className="rounded-lg border border-slate-700 bg-[#060e17] p-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
          name="type" 
          placeholder="Filter by type" 
          defaultValue={filters.type ?? ""} 
        />
        <input 
          className="rounded-lg border border-slate-700 bg-[#060e17] p-2 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50" 
          name="date" 
          type="date" 
          defaultValue={filters.date ?? ""} 
        />
        <button type="submit" className="rounded-lg bg-teal-600 p-2 text-white font-medium hover:bg-teal-500 transition-colors">
          Apply Filters
        </button>
      </form>

      <div className="bg-[#0d1b2a] border border-slate-800 rounded-xl overflow-hidden">
        <IncidentsTable incidents={stats.incidents} typeFilter={filters.type} dateFilter={filters.date} />
      </div>
    </div>
  );
}
