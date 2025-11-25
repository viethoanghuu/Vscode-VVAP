import express from "express";
import { z } from "zod";
import { pool } from "../config/database.js";
import { fetchReviewsFromSources } from "../services/mockScraper.js";
import {
  fetchProductMetadataFromCommerce,
  fetchReviewsFromCommerce,
  isCommerceApiEnabled,
} from "../services/commerceClient.js";

const router = express.Router();

const productSchema = z.object({
  id: z.string().min(2).max(120),
  name: z.string().min(2).max(255),
  image_url: z.string().url().optional().or(z.literal("")),
  source_url: z.string().url().optional().or(z.literal("")),
  active: z.boolean().optional(),
});

const moderationStatuses = ["pending", "approved", "flagged", "rejected"];

async function upsertProduct(product) {
  const { id, name, image_url, source_url, active = true } = product;
  await pool.execute(
    `INSERT INTO products (id, name, image_url, source_url, active)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      name=VALUES(name),
      image_url=VALUES(image_url),
      source_url=VALUES(source_url),
      active=VALUES(active),
      updated_at=CURRENT_TIMESTAMP`,
    [id, name, image_url || null, source_url || null, active ? 1 : 0],
  );
}

async function bulkInsertReviews(productId, reviews) {
  let added = 0;
  let skipped = 0;
  for (const s of reviews) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO reviews (product_id, source, review_id, author, rating, title, body, created_at, fetched_at, status, flag_reason, like_count, dislike_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           fetched_at = VALUES(fetched_at),
           rating = VALUES(rating),
           title = VALUES(title),
           body = VALUES(body),
           status = VALUES(status),
           flag_reason = VALUES(flag_reason),
           like_count = VALUES(like_count),
           dislike_count = VALUES(dislike_count)`,
        [
          productId,
          s.source,
          s.external_id,
          s.reviewer_name,
          s.rating,
          s.title,
          s.content,
          s.review_date,
          moderationStatuses.includes(s.status) ? s.status : "approved",
          s.flag_reason || null,
          Number(s.like_count || 0),
          Number(s.dislike_count || 0),
        ],
      );
      if (result.affectedRows === 1) added++;
      else skipped++;
    } catch (err) {
      if (String(err.code) === "ER_DUP_ENTRY") skipped++;
      else throw err;
    }
  }
  return { added, skipped, total: reviews.length };
}

async function buildAnalytics(productId) {
  const [[overall]] = await pool.execute(
    `SELECT COUNT(*) total, MIN(rating) mi, MAX(rating) ma, AVG(rating) avg
     FROM reviews WHERE product_id=? AND status <> 'rejected'`,
    [productId],
  );

  const [bySource] = await pool.execute(
    `SELECT source, ROUND(AVG(rating),1) AS average_rating, COUNT(*) AS review_count
     FROM reviews
     WHERE product_id=? AND status <> 'rejected'
     GROUP BY source`,
    [productId],
  );

  const [histRows] = await pool.execute(
    "SELECT rating, COUNT(*) c FROM reviews WHERE product_id=? AND status <> 'rejected' GROUP BY rating",
    [productId],
  );

  const hist = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
  histRows.forEach((r) => {
    hist[String(r.rating)] = r.c;
  });

  const [statusRows] = await pool.execute(
    "SELECT status, COUNT(*) c FROM reviews WHERE product_id=? GROUP BY status",
    [productId],
  );
  const statusCounts = { approved: 0, pending: 0, flagged: 0, rejected: 0 };
  statusRows.forEach((r) => {
    statusCounts[r.status] = r.c;
  });

  const [trendRows] = await pool.execute(
    `SELECT DATE(COALESCE(created_at, fetched_at)) AS day,
            COUNT(*) total,
            SUM(status='approved') approved,
            SUM(status='pending') pending,
            SUM(status='flagged') flagged,
            ROUND(AVG(rating),2) avg_rating
     FROM reviews
     WHERE product_id=? AND COALESCE(created_at, fetched_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
     GROUP BY day
     ORDER BY day ASC`,
    [productId],
  );

  return {
    overall: {
      average_rating: overall?.avg ? Number(overall.avg).toFixed(1) * 1 : 0,
      total_reviews: overall?.total || 0,
      min_rating: overall?.mi || 0,
      max_rating: overall?.ma || 0,
    },
    by_source: bySource,
    rating_histogram: hist,
    status_counts: statusCounts,
    trend: trendRows.map((r) => ({
      day: r.day,
      total: Number(r.total || 0),
      approved: Number(r.approved || 0),
      pending: Number(r.pending || 0),
      flagged: Number(r.flagged || 0),
      avg_rating: Number(r.avg_rating || 0),
    })),
  };
}

// GET /api/products
router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, image_url, source_url, active FROM products WHERE active=1 ORDER BY created_at DESC",
    );

    if (rows.length) {
      return res.json({ success: true, data: rows });
    }

    // Fallback: infer products from reviews when catalog table empty
    const [fromReviews] = await pool.execute(
      "SELECT DISTINCT product_id FROM reviews ORDER BY product_id ASC",
    );
    const products = fromReviews.map((r) => ({ id: r.product_id, name: r.product_id }));
    res.json({ success: true, data: products });
  } catch (e) {
    next(e);
  }
});

// POST /api/products - add/update a product
router.post("/", async (req, res, next) => {
  try {
    const parsed = productSchema.parse(req.body || {});
    await upsertProduct(parsed);
    res.json({ success: true, data: parsed });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: e.errors.map((er) => er.message).join(", ") });
    }
    next(e);
  }
});

// DELETE /api/products/:id - remove product (optional cascade delete reviews)
router.delete("/:id", async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    const cascade = String(req.query.cascade || "").toLowerCase() === "true";
    const [result] = await pool.execute("DELETE FROM products WHERE id=?", [productId]);
    if (cascade) {
      await pool.execute("DELETE FROM reviews WHERE product_id=?", [productId]);
    }
    res.json({ success: true, deleted: result.affectedRows === 1, cascade });
  } catch (e) {
    next(e);
  }
});

// POST /api/products/:id/sync - fetch from real commerce API (fallback to mock scraper)
router.post("/:id/sync", async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    let reviews = [];
    let source = "mock";

    if (isCommerceApiEnabled()) {
      try {
        const productMeta = await fetchProductMetadataFromCommerce(productId);
        if (productMeta) {
          await upsertProduct({ ...productMeta, active: true });
        }
        const commerceReviews = await fetchReviewsFromCommerce(productId);
        if (Array.isArray(commerceReviews) && commerceReviews.length) {
          reviews = commerceReviews;
          source = "commerce";
        }
      } catch (err) {
        console.error("Commerce API failed, falling back to mock scraper:", err.message);
      }
    }

    if (!reviews.length) {
      reviews = await fetchReviewsFromSources(productId);
      await upsertProduct({ id: productId, name: productId, active: true });
    }

    const summary = await bulkInsertReviews(productId, reviews);
    res.json({ success: true, data: { ...summary, source } });
  } catch (e) {
    next(e);
  }
});

// POST /api/products/:id/fetch - keep legacy route pointing at mock scraper
router.post("/:id/fetch", async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    const scraped = await fetchReviewsFromSources(productId);
    const summary = await bulkInsertReviews(productId, scraped);
    res.json({ success: true, data: summary });
  } catch (e) {
    next(e);
  }
});

// GET /api/products/:id/reviews
router.get("/:id/reviews", async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    const [rows] = await pool.execute(
      `SELECT product_id, source, review_id, author AS reviewer_name, rating, title, body AS content,
              created_at, fetched_at, status, flag_reason, like_count, dislike_count
       FROM reviews
       WHERE product_id=?
       ORDER BY COALESCE(created_at, fetched_at) DESC
       LIMIT 500`,
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
    const analytics = await buildAnalytics(productId);
    res.json({ success: true, data: analytics });
  } catch (e) {
    next(e);
  }
});

// POST /api/products/:id/reviews/:source/:reviewId/flag
router.post("/:id/reviews/:source/:reviewId/flag", async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    const source = String(req.params.source);
    const reviewId = String(req.params.reviewId);
    const reason = req.body?.reason ? String(req.body.reason).slice(0, 250) : null;

    const [result] = await pool.execute(
      `UPDATE reviews
       SET status='flagged', flag_reason=?, last_moderated_at=NOW()
       WHERE product_id=? AND source=? AND review_id=?`,
      [reason, productId, source, reviewId],
    );

    res.json({ success: true, updated: result.affectedRows === 1 });
  } catch (e) {
    next(e);
  }
});

// POST /api/products/:id/reviews/:source/:reviewId/react - increment like/dislike counters
router.post("/:id/reviews/:source/:reviewId/react", async (req, res, next) => {
  try {
    const productId = String(req.params.id);
    const source = String(req.params.source);
    const reviewId = String(req.params.reviewId);
    const action = String(req.body?.action || "").toLowerCase();

    if (!["like", "dislike"].includes(action)) {
      return res.status(400).json({ success: false, error: "Invalid action" });
    }

    const column = action === "like" ? "like_count" : "dislike_count";
    const [result] = await pool.execute(
      `UPDATE reviews
       SET ${column} = ${column} + 1, last_moderated_at=NOW()
       WHERE product_id=? AND source=? AND review_id=?`,
      [productId, source, reviewId],
    );

    if (result.affectedRows !== 1) {
      return res.status(404).json({ success: false, error: "Review not found" });
    }

    const [[row]] = await pool.execute(
      "SELECT like_count, dislike_count FROM reviews WHERE product_id=? AND source=? AND review_id=?",
      [productId, source, reviewId],
    );

    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
});

export default router;
