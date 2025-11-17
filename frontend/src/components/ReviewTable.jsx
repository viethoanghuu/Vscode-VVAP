import React from "react";
import RatingStars from "./RatingStars";

export default function ReviewTable({ reviews }) {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return (
      <div className="card">
        <p>No reviews yet. Click “Fetch Reviews”.</p>
      </div>
    );
  }

  return (
    <div className="card" role="region" aria-label="Reviews table">
      <h3 className="card-title">Reviews</h3>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th scope="col" style={{ width: 120 }}>
                Source
              </th>
              <th scope="col" style={{ width: 120 }}>
                Rating
              </th>
              <th scope="col" style={{ width: 160 }}>
                Author
              </th>
              <th scope="col">Title</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => {
              const key = r.id || `${r.source}-${r.review_id || r.title}`;
              return (
                <tr key={key} tabIndex={0}>
                  <td>
                    <span className="badge" aria-label={`Source ${r.source}`}>
                      {r.source}
                    </span>
                  </td>
                  <td>
                    <RatingStars value={r.rating} />
                  </td>
                  <td>{r.author || "-"}</td>
                  <td>{r.title || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
