import express from "express";
import { pool } from "../config/database.js";
import { fetchReviewsFromSources } from "../services/mockScraper.js";

const router = express.Router();

// POST /api/products/:id/fetch
router.post("/:id/fetch", async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    const scraped = await fetchReviewsFromSources(productId);

    let added = 0,
      skipped = 0;

    for (const s of scraped) {
      try {
        const [result] = await pool.execute(
          `INSERT INTO reviews (product_id, source, review_id, author, rating, title, body, created_at, fetched_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE fetched_at = VALUES(fetched_at)`,
          [
            productId,
            s.source,
            s.external_id,
            s.reviewer_name,
            s.rating,
            s.title,
            s.content,
            s.review_date,
          ],
        );
        if (result.affectedRows === 1) added++;
        else skipped++;
      } catch (err) {
        if (String(err.code) === "ER_DUP_ENTRY") skipped++;
        else throw err;
      }
    }

    res.json({ success: true, data: { added, skipped, total: scraped.length } });
  } catch (e) {
    next(e);
  }
});

// GET /api/products/:id/reviews
router.get("/:id/reviews", async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    const [rows] = await pool.execute(
      `SELECT product_id, source, review_id, author AS reviewer_name, rating, title, body AS content, created_at, fetched_at
       FROM reviews WHERE product_id=? ORDER BY created_at DESC LIMIT 500`,
      [productId],
    );
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e) {
    next(e);
  }
});

// GET /api/products/:id/aggregate
router.get("/:id/aggregate", async (req, res, next) => {
  try {
    const productId = String(req.params.id);

    const [[overall]] = await pool.execute(
      "SELECT COUNT(*) total, MIN(rating) mi, MAX(rating) ma, AVG(rating) avg FROM reviews WHERE product_id=?",
      [productId],
    );

    const [bySource] = await pool.execute(
      "SELECT source, ROUND(AVG(rating),1) AS average_rating, COUNT(*) AS review_count FROM reviews WHERE product_id=? GROUP BY source",
      [productId],
    );

    const [histRows] = await pool.execute(
      "SELECT rating, COUNT(*) c FROM reviews WHERE product_id=? GROUP BY rating",
      [productId],
    );

    const hist = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    histRows.forEach((r) => {
      hist[String(r.rating)] = r.c;
    });

    res.json({
      success: true,
      data: {
        overall: {
          average_rating: overall.avg ? Number(overall.avg).toFixed(1) * 1 : 0,
          total_reviews: overall.total || 0,
          min_rating: overall.mi || 0,
          max_rating: overall.ma || 0,
        },
        by_source: bySource,
        rating_histogram: hist,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
