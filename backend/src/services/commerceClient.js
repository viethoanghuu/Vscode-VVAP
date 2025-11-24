import axios from "axios";

// Thin wrapper around a real commerce API. Falls back to null when not configured.
const baseURL = process.env.COMMERCE_API_URL?.replace(/\/$/, "") || null;
const apiKey = process.env.COMMERCE_API_KEY;

const client = baseURL
  ? axios.create({
      baseURL,
      timeout: 8000,
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}`, "X-API-Key": apiKey } : {}),
      },
    })
  : null;

export function isCommerceApiEnabled() {
  return Boolean(client);
}

export async function fetchProductMetadataFromCommerce(productId) {
  if (!client) return null;
  const { data } = await client.get(`/products/${productId}`);
  const payload = data?.data || data || {};
  return {
    id: payload.id || productId,
    name: payload.name || payload.title || productId,
    image_url: payload.image_url || payload.image || payload.thumbnail || null,
    source_url: payload.url || payload.link || null,
  };
}

export async function fetchReviewsFromCommerce(productId) {
  if (!client) return null;
  const { data } = await client.get(`/products/${productId}/reviews`);
  const list = data?.data || data || [];
  return list.map((r, idx) => ({
    source: r.source || r.vendor || "CommerceAPI",
    external_id: r.id || r.review_id || `${productId}-commerce-${idx}`,
    reviewer_name: r.author || r.reviewer_name || "Anonymous",
    rating: Number(r.rating ?? r.score ?? 0),
    title: r.title || r.headline || "Review",
    content: r.content || r.body || r.text || "",
    review_date: r.created_at || r.review_date || r.date || new Date().toISOString(),
    status: r.status || "approved",
    flag_reason: r.flag_reason || null,
  }));
}
