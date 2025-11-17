import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function SourceBreakdownChart({ perSource }) {
  if (!perSource || typeof perSource !== "object") return null;

  const srcs = Object.entries(perSource || {});
  if (srcs.length === 0) return null;

  const data = srcs.map(([name, v]) => ({ name, value: Number(v.count || 0) }));
  const palette = [
    "#2563eb",
    "#059669",
    "#f59e0b",
    "#ef4444",
    "#7c3aed",
    "#0ea5e9",
  ];

  return (
    <div className="card" role="region" aria-label="Source breakdown">
      <h3 className="card-title">Reviews by Source</h3>
      <div className="chart" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              label
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={palette[idx % palette.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mini-list">
        {srcs.map(([name, v]) => (
          <li key={name}>
            <strong>{name}</strong>: {v.count ?? 0} reviews (avg {v.average ?? "-"})
          </li>
        ))}
      </ul>
    </div>
  );
}
