import React from "react";

export default function RatingStars({ value = 0 }) {
  // round to nearest integer between 0 and 5
  const full = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));

  return (
    <span
      className="rating-stars"
      role="img"
      aria-label={`Rating: ${full} out of 5`}
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            marginRight: 4,
            opacity: i <= full ? 1 : 0.35,
            lineHeight: 1,
            fontSize: 16,
          }}
        >
          ⭐
        </span>
      ))}
    </span>
  );
}

