import React from "react";
import RatingStars from "./RatingStars";

export default function StatsCards({ stats }) {
  // Return null when no stats provided
  if (!stats) return null;

  const total = stats.count ?? 0;
  const avg = stats.average ?? 0;
  const sources = stats.perSource ? Object.keys(stats.perSource).length : 0;
  const flagged = stats.statusCounts?.flagged ?? 0;
  const pending = stats.statusCounts?.pending ?? 0;

  return (
    <div className="grid cards">
      <div className="card">
        <div className="label">Total Reviews</div>
        <div className="value">{total}</div>
      </div>

      <div className="card">
        <div className="label">Average Rating</div>
        <div className="value">
          <RatingStars value={avg} />
        </div>
      </div>

      <div className="card">
        <div className="label">Sources</div>
        <div className="value">{sources}</div>
      </div>

      <div className="card">
        <div className="label">Flagged</div>
        <div className="value">{flagged}</div>
      </div>

      <div className="card">
        <div className="label">Pending</div>
        <div className="value">{pending}</div>
      </div>
    </div>
  );
}
