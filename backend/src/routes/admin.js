import express from "express";
import { z } from "zod";
import { pool } from "../config/database.js";

const router = express.Router();

const moderationSchema = z.object({
  status: z.enum(["pending", "approved", "flagged", "rejected"]).optional(),
  flag_reason: z.string().max(255).optional(),
});

// GET /api/admin/reviews/flagged - fetch flagged & pending reviews
router.get("/reviews/flagged", async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT product_id, source, review_id, author, rating, title, body, created_at, status, flag_reason, fetched_at
       FROM reviews
       WHERE status IN ('flagged', 'pending')
       ORDER BY fetched_at DESC
       LIMIT 300`,
    );
    res.json({ success: true, data: rows, count: rows.length });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/admin/reviews/:productId/:source/:reviewId - moderate a review
router.patch("/reviews/:productId/:source/:reviewId", async (req, res, next) => {
  try {
    const productId = String(req.params.productId);
    const source = String(req.params.source);
    const reviewId = String(req.params.reviewId);
    const payload = moderationSchema.parse(req.body || {});

    if (!payload.status && !payload.flag_reason) {
      return res.status(400).json({ success: false, error: "No moderation changes supplied" });
    }

    const updates = [];
    const params = [];

    if (payload.status) {
      updates.push("status=?");
      params.push(payload.status);
    }
    if (Object.prototype.hasOwnProperty.call(payload, "flag_reason")) {
      updates.push("flag_reason=?");
      params.push(payload.flag_reason || null);
    }

    updates.push("last_moderated_at=NOW()");

    params.push(productId, source, reviewId);

    const [result] = await pool.execute(
      `UPDATE reviews
       SET ${updates.join(", ")}
       WHERE product_id=? AND source=? AND review_id=?`,
      params,
    );

    res.json({ success: true, updated: result.affectedRows === 1 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: e.errors.map((er) => er.message).join(", ") });
    }
    next(e);
  }
});

export default router;
