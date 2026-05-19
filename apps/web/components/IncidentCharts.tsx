"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";

type MonthPoint = { month: string; count: number };
type TypePoint = { type: string; count: number };

type Props = {
  incidentsPerMonth: MonthPoint[];
  violationsByType: TypePoint[];
};

const COLORS = ["#0f766e", "#1d4ed8", "#ea580c", "#7c3aed", "#be123c"];

export function IncidentCharts({ incidentsPerMonth, violationsByType }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Incidents per month</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incidentsPerMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Violations by type</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={violationsByType} dataKey="count" nameKey="type" outerRadius={110} label>
                {violationsByType.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
