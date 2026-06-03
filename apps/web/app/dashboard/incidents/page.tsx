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
          <h1 className="text-3xl font-bold text-ink tracking-tight">Incident Management</h1>
          <p className="text-inkmuted mt-1">Review and manage reported violations</p>
        </div>
      </header>

      <form className="grid gap-4 rounded-xl border border-hairline bg-surface p-4 md:grid-cols-3" method="GET">
        <input 
          className="rounded-lg border border-hairline bg-canvas p-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/50" 
          name="type" 
          placeholder="Filter by type" 
          defaultValue={filters.type ?? ""} 
        />
        <input 
          className="rounded-lg border border-hairline bg-canvas p-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/50" 
          name="date" 
          type="date" 
          defaultValue={filters.date ?? ""} 
        />
        <button type="submit" className="rounded-lg bg-accent p-2 text-ink font-medium hover:bg-accent transition-colors">
          Apply Filters
        </button>
      </form>

      <div className="bg-surface border border-hairline rounded-xl overflow-hidden">
        <IncidentsTable incidents={stats.incidents} typeFilter={filters.type} dateFilter={filters.date} />
      </div>
    </div>
  );
}
