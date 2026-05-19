type Incident = {
  id: string;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at: string;
  evidence?: { image_url: string }[];
};

type Props = {
  incidents: Incident[];
  typeFilter?: string;
  dateFilter?: string;
};

export function IncidentsTable({ incidents, typeFilter, dateFilter }: Props) {
  const filtered = incidents.filter((incident) => {
    const byType = typeFilter ? incident.type === typeFilter : true;
    const byDate = dateFilter ? incident.created_at.slice(0, 10) === dateFilter : true;
    return byType && byDate;
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-lg font-semibold">Incidents</h3>
      <div className="overflow-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="pb-2">Date</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Description</th>
              <th className="pb-2">Location</th>
              <th className="pb-2">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((incident) => (
              <tr key={incident.id} className="border-b border-slate-100">
                <td className="py-2">{new Date(incident.created_at).toLocaleString()}</td>
                <td className="py-2">{incident.type}</td>
                <td className="py-2">{incident.description}</td>
                <td className="py-2">
                  {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                </td>
                <td className="py-2">
                  <div className="flex gap-2">
                    {incident.evidence?.map((ev, i) => (
                      <a key={i} href={ev.image_url} target="_blank" rel="noreferrer">
                        <img 
                          src={ev.image_url} 
                          alt="Evidence" 
                          className="h-10 w-10 rounded object-cover border border-slate-200" 
                        />
                      </a>
                    ))}
                    {!incident.evidence || incident.evidence.length === 0 ? (
                      <span className="text-slate-400">None</span>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400">
                  No incidents found
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
