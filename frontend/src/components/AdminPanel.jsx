import React from "react";
import RatingStars from "./RatingStars";

function formatDate(value) {
  if (!value) return "Unknown date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export default function AdminPanel({ reviews = [], onModerate, loading }) {
  return (
    <div className="card admin-card" role="region" aria-label="Moderation queue">
      <div className="admin-card-header">
        <div>
          <h3 className="card-title">Moderation queue</h3>
          <div className="label">Flagged & pending reviews</div>
        </div>
        <div className="badge">{reviews.length} items</div>
      </div>

      {loading ? (
        <p className="muted">Loading moderation queue...</p>
      ) : reviews.length === 0 ? (
        <p className="muted">No flagged or pending reviews 🎉</p>
      ) : (
        <div className="admin-list">
          {reviews.map((r) => (
            <article key={`${r.product_id}-${r.review_id}-${r.source}`} className="admin-item">
              <div className="admin-item-header">
                <div>
                  <div className="pill pill-warm">{r.status || "pending"}</div>
                  <div className="admin-meta">
                    {r.product_id} • {r.source} • {formatDate(r.created_at || r.fetched_at)}
                  </div>
                </div>
                <RatingStars value={Number(r.rating || 0)} />
              </div>
              <div className="admin-title">{r.title || "Untitled"}</div>
              <p className="admin-body">{r.body || r.content}</p>
              {r.flag_reason && <div className="flag-reason">Flag: {r.flag_reason}</div>}
              <div className="admin-actions">
                <button type="button" onClick={() => onModerate(r, "approved")}>Approve</button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    const reason = window.prompt("Flag reason?", r.flag_reason || "") || "";
                    onModerate(r, "flagged", reason.trim());
                  }}
                >
                  Keep Flagged
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => onModerate(r, "rejected")}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
