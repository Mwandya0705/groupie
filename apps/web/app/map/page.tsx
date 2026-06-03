import Link from "next/link";
import { fetchDashboardStats, fetchPatrolRoutes } from "../../lib/queries";
import { MapPanel } from "../../components/MapPanel";
export const dynamic = "force-dynamic";

export default async function MapPage() {
  const [stats, patrols] = await Promise.all([fetchDashboardStats(), fetchPatrolRoutes()]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Patrol Routes & Incident Map</h1>
        <Link href="/dashboard" className="rounded bg-surface3 px-3 py-2 text-ink">
          Back to dashboard
        </Link>
      </header>
      <MapPanel patrols={patrols} incidents={stats.incidents} />
    </main>
  );
}
