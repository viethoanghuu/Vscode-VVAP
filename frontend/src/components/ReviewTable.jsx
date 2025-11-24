import React, { useEffect, useMemo, useState } from "react";
import RatingStars from "./RatingStars";

const SOURCE_COLORS = {
  Amazon: "#ff9900",
  BestBuy: "#f97316",
  Newegg: "#facc15",
  Walmart: "#ef4444",
  default: "#f97316",
};

function formatDate(value) {
  if (!value) return "Unknown date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function pickColor(source) {
  return SOURCE_COLORS[source] || SOURCE_COLORS.default;
}

function buildInitial(name) {
  if (!name) return "?";
  const clean = name.trim();
  if (!clean) return "?";
  return clean.charAt(0).toUpperCase();
}

export default function ReviewTable({ reviews, onFlagReview }) {
  const hasReviews = Array.isArray(reviews) && reviews.length > 0;
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    // Reset to first page when list changes
    setPage(1);
  }, [reviews]);

  const prepared = useMemo(() => {
    if (!hasReviews) return [];
    return reviews.map((r, idx) => {
      const key = r.id || r.review_id || `${r.source}-${idx}`;
      return {
        key,
        product_id: r.product_id,
        source: r.source || "Unknown",
        review_id: r.review_id || r.id || key,
        author: r.author || r.reviewer_name || "Unknown reviewer",
        title: r.title || "Untitled review",
        body: r.content || r.body || r.comment || "No content provided.",
        rating: Number(r.rating || 0),
        date: r.created_at || r.review_date || null,
        status: r.status || "approved",
        flag_reason: r.flag_reason,
      };
    });
  }, [hasReviews, reviews]);

  const totalPages = Math.max(1, Math.ceil(prepared.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * PAGE_SIZE;
  const paged = prepared.slice(start, start + PAGE_SIZE);

  if (!hasReviews) {
    return (
      <div className="card reviews-card-empty">
        <p>No reviews yet. Click "Fetch Reviews".</p>
      </div>
    );
  }

  return (
    <div className="card reviews-card" role="region" aria-label="Reviews list">
      <h3 className="card-title">Reviews</h3>
      <div className="reviews-list">
        {paged.map((r, idx) => {
          const color = pickColor(r.source);
          return (
            <article
              key={r.key}
              className="review-tile animate-in"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="review-header">
                <div className="reviewer">
                  <div
                    className="avatar"
                    aria-hidden="true"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${color}, #ffedd5)`,
                      color: "#0f1724",
                    }}
                  >
                    {buildInitial(r.author)}
                  </div>
                  <div className="reviewer-meta">
                <div className="name-row">
                  <span className="name">{r.author}</span>
                  <span
                    className="source-pill"
                    style={{
                          backgroundColor: color,
                          boxShadow: `0 8px 18px ${color}33`,
                        }}
                      >
                        {r.source}
                      </span>
                    </div>
                    <div className="date-row">📅 {formatDate(r.date)}</div>
                  </div>
                </div>

                <div className="rating-block" aria-label={`Rating ${r.rating} out of 5`}>
                  <RatingStars value={r.rating} />
                  <span className="rating-number">({r.rating}/5)</span>
                </div>
              </div>

              <div className="review-body">
                <div className="review-title">{r.title}</div>
                <p className="review-text">{r.body}</p>
                <div className="review-footer">
                  <span className={`pill ${r.status === "flagged" ? "pill-warm" : "pill-muted"}`}>
                    {r.status}
                  </span>
                  {r.flag_reason && <span className="flag-reason">Flag: {r.flag_reason}</span>}
                  {onFlagReview && (
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => onFlagReview(r)}
                    >
                      Flag
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {prepared.length > PAGE_SIZE && (
        <div className="pagination">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1}>
            Prev
          </button>
          <span className="page-meta">
            Page {pageSafe} / {totalPages} • {prepared.length} reviews
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageSafe === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
