import React, { useEffect, useRef, useState } from "react";
import { Pie, PieChart, Tooltip, Cell, Legend, ResponsiveContainer } from "recharts";

export default function StatusChart({ statusCounts }) {
  const entries = Object.entries(statusCounts || {}).filter(([, v]) => Number(v) > 0);
  if (!entries.length) return null;

  const colors = {
    approved: "#22c55e",
    pending: "#facc15",
    flagged: "#f97316",
    rejected: "#ef4444",
  };
  const data = entries.map(([name, value]) => ({ name, value: Number(value || 0) }));
  const boxRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!boxRef.current) return undefined;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect || { width: 0, height: 0 };
      setReady(width > 0 && height > 0);
    });
    obs.observe(boxRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="card" role="region" aria-label="Status breakdown">
      <h3 className="card-title">Moderation status</h3>
      <div className="chart" style={{ height: 260 }} ref={boxRef}>
        {ready && (
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
                {data.map((d, idx) => (
                  <Cell key={d.name} fill={colors[d.name] || ["#60a5fa", "#22c55e", "#f97316", "#ef4444"][idx % 4]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
