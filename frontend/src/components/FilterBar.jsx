import React, { useMemo } from "react";

export default function FilterBar({ perSource = {}, active = [], onChange, ratingFilter, onRatingChange }) {
  const sources = useMemo(() => Object.keys(perSource || {}), [perSource]);
  if (!sources || sources.length === 0) return null;

  const toggle = (name) => {
    const set = new Set(active);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    onChange && onChange(Array.from(set));
  };

  return (
    <div className="card filterbar" role="group" aria-label="Filter reviews by source">
      <div className="filter-row">
        <span className="label">Filter by source:</span>
        <div className="chips">
          <button
            type="button"
            className={`chip ${active.length === sources.length ? "chip-on" : ""}`}
            onClick={() => onChange && onChange(sources)}
            aria-pressed={active.length === sources.length}
          >
            All
          </button>

          <button
            type="button"
            className={`chip ${active.length === 0 ? "chip-on" : ""}`}
            onClick={() => onChange && onChange([])}
            aria-pressed={active.length === 0}
          >
            None
          </button>

          {sources.map((s) => {
            const on = active.includes(s);
            return (
              <button
                key={s}
                type="button"
                className={`chip ${on ? "chip-on" : ""}`}
                onClick={() => toggle(s)}
                aria-pressed={on}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filter-row">
        <span className="label">Filter by rating:</span>
        <div className="chips">
          {[
            { key: null, label: "All" },
            { key: "5", label: "5★" },
            { key: "4plus", label: "≥ 4★" },
            { key: "3plus", label: "≥ 3★" },
            { key: "2below", label: "≤ 2★" },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              className={`chip ${ratingFilter === opt.key ? "chip-on" : ""}`}
              onClick={() => onRatingChange && onRatingChange(opt.key)}
              aria-pressed={ratingFilter === opt.key}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
