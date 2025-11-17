import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function HistogramChart({ histogram }) {
  if (!histogram || !Array.isArray(histogram) || histogram.length !== 5) return null;

  const data = histogram.map((n, i) => ({ star: `${i + 1}★`, count: n }));

  return (
    <div className="card" role="region" aria-label="Rating histogram">
      <h3 className="card-title">Rating Histogram</h3>
      <div className="chart" style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} aria-hidden={false}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="star" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--accent, #60A5FA)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
