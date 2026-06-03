import Link from "next/link";
import { IncidentsTable } from "../../components/IncidentsTable";
import { fetchDashboardStats } from "../../lib/queries";
export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string;
  date?: string;
};

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = await searchParams;
  const stats = await fetchDashboardStats();

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Incident Reports</h1>
        <Link href="/dashboard" className="rounded bg-surface3 px-3 py-2 text-ink">
          Back
        </Link>
      </header>

      <form className="grid gap-3 rounded-xl border border-hairline bg-surface p-4 md:grid-cols-3" method="GET">
        <input className="rounded border p-2" name="type" placeholder="Filter by type" defaultValue={filters.type ?? ""} />
        <input className="rounded border p-2" name="date" type="date" defaultValue={filters.date ?? ""} />
        <button type="submit" className="rounded bg-blue-700 p-2 text-ink">
          Apply Filters
        </button>
      </form>

      <IncidentsTable incidents={stats.incidents} typeFilter={filters.type} dateFilter={filters.date} />
    </main>
  );
}
