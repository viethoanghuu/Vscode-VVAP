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

  const cards = [
    { key: "total", label: "Total Reviews", value: total, sub: "All sources combined", accent: "blue" },
    {
      key: "avg",
      label: "Average Rating",
      value: (
        <div className="stat-rating">
          <RatingStars value={avg} />
          <span className="stat-number">{avg.toFixed(1)}/5</span>
        </div>
      ),
      sub: "Weighted by count",
      accent: "amber",
    },
    { key: "sources", label: "Sources", value: sources, sub: "Active feeds", accent: "teal" },
    { key: "flagged", label: "Flagged", value: flagged, sub: "Needing review", accent: "pink" },
    { key: "pending", label: "Pending", value: pending, sub: "Awaiting moderation", accent: "violet" },
  ];

  return (
    <div className="grid cards">
      {cards.map((card) => (
        <div key={card.key} className={`card stat-card accent-${card.accent}`}>
          <div className="label">{card.label}</div>
          <div className="value">{card.value}</div>
          <div className="stat-sub">{card.sub}</div>
          <div className="stat-glow" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
