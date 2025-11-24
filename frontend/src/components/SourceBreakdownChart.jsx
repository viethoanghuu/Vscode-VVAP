import React, { useEffect, useRef, useState } from "react";
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
    <div className="card" role="region" aria-label="Source breakdown">
      <h3 className="card-title">Reviews by Source</h3>
      <div className="chart" style={{ height: 260 }} ref={boxRef}>
        {ready && (
          <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
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
              <Legend
                verticalAlign="bottom"
                layout="horizontal"
                align="center"
                iconType="square"
                iconSize={10}
                wrapperStyle={{ paddingTop: 6, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
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
