import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function TrendChart({ data }) {
  if (!Array.isArray(data) || data.length === 0) return null;

  return (
    <div className="card" role="region" aria-label="30 day trend">
      <h3 className="card-title">30-day review trend</h3>
      <div className="chart" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="total" stackId="1" stroke="#60a5fa" fill="#60a5fa33" />
            <Area type="monotone" dataKey="approved" stackId="1" stroke="#10b981" fill="#10b98133" />
            <Area type="monotone" dataKey="flagged" stackId="1" stroke="#f97316" fill="#f9731633" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
