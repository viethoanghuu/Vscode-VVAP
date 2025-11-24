import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import StatsCards from "./components/StatsCards";
import HistogramChart from "./components/HistogramChart";
import SourceBreakdownChart from "./components/SourceBreakdownChart";
import ReviewTable from "./components/ReviewTable";
import Toast from "./components/Toast";
import "./App.css";
import RatingStars from "./components/RatingStars";
import FilterBar from "./components/FilterBar";

const FALLBACK_PRODUCTS = [
  { id: "asus-rog-zephyrus-g16", name: "ASUS ROG Zephyrus G16" },
  { id: "lenovo-legion-5-pro", name: "Lenovo Legion 5 Pro" },
  { id: "acer-predator-helios-300", name: "Acer Predator Helios 300" },
  { id: "msi-raider-ge78", name: "MSI Raider GE78" },
  { id: "alienware-m16", name: "Alienware M16" },
  { id: "hp-omen-16", name: "HP Omen 16" },
];

const PRODUCT_IMAGES = {
  "asus-rog-zephyrus-g16":
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
  "lenovo-legion-5-pro":
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  "acasusrogzephyrusg16predator-helios-300":
    "https://imageslenovolegion5proash.com/photo-1505740420928-5e560c06d30e?auto=facerpredatorhelios300.jpgcrop&w=1200&q=80",
  "msi-raider-RaiderGE78
    "https://images.unsplash.com/palienwarem16.jpg77542470-605612bd2d61?auto=fohpomen.avifrop&w=12const DEFAULT_PRODUCT_IMAGE = "/images/lenovolegion5pro.jpg";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "admin", label: "Admin" },
  { id: "catalog", label: "Catalog" },
];

export default function App() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [selected, setSelected] = useState(FALLBACK_PRODUCTS[0].id);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeSources, setActiveSources] = useState([]);
  const [toast, setToast] = useState(null);
  const [flaggedQueue, setFlaggedQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    id: "",
    name: "",
    image_url: "",
    source_url: "",
  });
  const [savingProduct, setSavingProduct] = useState(false);

  const API = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, ""),
    [],
  );

  const normalizeAggregate = useCallback((agg) => {
    if (!agg) return null;
    const perSource = (agg.by_source || []).reduce((acc, s) => {
      acc[s.source] = { average: s.average_rating, count: s.review_count };
      return acc;
    }, {});
    const histogramArr = [1, 2, 3, 4, 5].map((n) => agg.rating_histogram?.[String(n)] || 0);
    const statusCounts = agg.status_counts || {};
    const trend = (agg.trend || []).map((t) => ({
      day: t.day
        ? new Date(t.day).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : "",
      total: Number(t.total || 0),
      approved: Number(t.approved || 0),
      flagged: Number(t.flagged || 0),
      pending: Number(t.pending || 0),
    }));
    return {
      count: agg.overall?.total_reviews ?? 0,
      average: Number(agg.overall?.average_rating ?? 0),
      perSource,
      histogram: histogramArr,
      statusCounts,
      trend,
    };
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      if (!selected) return;
      setLoading(true);
      const [res, agg] = await Promise.all([
        axios.get(`${API}/api/products/${selected}/reviews`),
        axios.get(`${API}/api/products/${selected}/aggregate`),
      ]);
      const reviewsData = (res.data?.data ?? res.data ?? []).filter((r) => r.status !== "rejected");
      const aggData = normalizeAggregate(agg.data?.data ?? agg.data);
      setReviews(reviewsData);
      setStats(aggData);
      setActiveSources(Object.keys(aggData?.perSource || {}));
      setToast({ type: "success", message: "Fetched & updated reviews." });
    } catch (err) {
      console.error(err);
      const detail = err?.response?.data?.error || err?.message || "Error fetching reviews";
      setToast({ type: "error", message: String(detail) });
    } finally {
      setLoading(false);
    }
  }, [API, normalizeAggregate, selected]);

  const loadProducts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/products`);
      const list = res.data?.data ?? res.data ?? [];
      const normalized = list
        .map((p) => ({
          id: p.id || p.product_id || String(p),
          name: p.name || p.product_id || String(p),
          image_url: p.image_url || null,
          source_url: p.source_url || null,
        }))
        .filter((p) => p.id);
      if (normalized.length) {
        setProducts(normalized);
        setSelected((prev) => (prev && normalized.some((p) => p.id === prev) ? prev : normalized[0].id));
      }
    } catch (err) {
      console.error("Failed to load products from API, using fallback.", err);
      setToast((prev) => prev || { type: "warning", message: "Using fallback product list." });
    }
  }, [API]);

  const fetchFlaggedReviews = useCallback(async () => {
    try {
      setQueueLoading(true);
      const res = await axios.get(`${API}/api/admin/reviews/flagged`);
      const data = res.data?.data ?? res.data ?? [];
      setFlaggedQueue(data);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Failed to load flagged list." });
    } finally {
      setQueueLoading(false);
    }
  }, [API]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (activeTab === "admin") {
      fetchFlaggedReviews();
    }
  }, [activeTab, fetchFlaggedReviews]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selected) || { id: selected, name: selected },
    [products, selected],
  );
  const title = selectedProduct?.name || selected;
  const [heroSrc, setHeroSrc] = useState(
    selectedProduct.image_url || PRODUCT_IMAGES[selectedProduct.id] || DEFAULT_PRODUCT_IMAGE,
  );

  useEffect(() => {
    // Update hero when product changes
    setHeroSrc(selectedProduct.image_url || PRODUCT_IMAGES[selectedProduct.id] || DEFAULT_PRODUCT_IMAGE);
  }, [selectedProduct]);
  const filteredReviews = activeSources.length
    ? reviews.filter((r) => activeSources.includes(r.source) && r.status !== "rejected")
    : [];

  async function syncFromCommerce() {
    try {
      setSyncing(true);
      await axios.post(`${API}/api/products/${selected}/sync`);
      setToast({ type: "success", message: "Synced live data." });
      await fetchReviews();
      await fetchFlaggedReviews();
    } catch (err) {
      console.error(err);
      const detail = err?.response?.data?.error || err?.message || "Sync failed";
      setToast({ type: "error", message: String(detail) });
    } finally {
      setSyncing(false);
    }
  }

  async function flagReview(review) {
    try {
      const reason = window.prompt("Flag reason?", review.flag_reason || "") || "";
      if (!review.review_id || !review.source) return;
      await axios.post(`${API}/api/products/${review.product_id || selected}/reviews/${review.source}/${review.review_id}/flag`, {
        reason,
      });
      setToast({ type: "success", message: "Review flagged." });
      await fetchFlaggedReviews();
      await fetchReviews();
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Could not flag review." });
    }
  }

  async function moderateReview(review, status, reason) {
    try {
      await axios.patch(
        `${API}/api/admin/reviews/${review.product_id}/${review.source}/${review.review_id}`,
        { status, flag_reason: reason },
      );
      setToast({ type: "success", message: `Status updated: ${status}` });
      await fetchFlaggedReviews();
      if (review.product_id === selected) await fetchReviews();
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Could not update status." });
    }
  }

  async function handleAddProduct() {
    if (!productForm.id || !productForm.name) {
      setToast({ type: "error", message: "Product ID and name are required." });
      return;
    }
    try {
      setSavingProduct(true);
      await axios.post(`${API}/api/products`, productForm);
      setToast({ type: "success", message: "Product saved." });
      setProductForm({ id: "", name: "", image_url: "", source_url: "" });
      await loadProducts();
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Could not save product." });
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm("Delete product and all reviews?")) return;
    try {
      await axios.delete(`${API}/api/products/${id}`, { params: { cascade: true } });
      if (id === selected) {
        const next = products.find((p) => p.id !== id)?.id || FALLBACK_PRODUCTS[0].id;
        setSelected(next);
      }
      await loadProducts();
      setToast({ type: "success", message: "Product deleted." });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Could not delete product." });
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-inner">
          <h1>Gaming Laptop Review Aggregator</h1>
          <div className="controls">
            <div className="tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab ${activeTab === tab.id ? "tab-on" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="select-wrap">
              <select
                className="product-select"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                aria-label="Select product"
              >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              </select>
            </div>
            <button onClick={fetchReviews} disabled={loading}>
              {loading ? "Fetching..." : "Fetch Reviews"}
            </button>
            <button onClick={syncFromCommerce} disabled={syncing}>
              {syncing ? "Syncing..." : "Sync live"}
            </button>
          </div>
        </div>
      </header>

      <section className="content">
        {activeTab === "dashboard" && (
          <>
            <div className="product-hero card">
              <div className="product-hero-text">
                <div className="label">Selected product</div>
                <h2 className="product-hero-title">{title}</h2>
                <p className="product-hero-sub">Showing live reviews from your database.</p>
                {selectedProduct.source_url && (
                  <a className="pill pill-link" href={selectedProduct.source_url} target="_blank" rel="noreferrer">
                    View on storefront
                  </a>
                )}
              </div>
              <div className="product-hero-image" aria-hidden="true">
                <img
                  src={heroSrc}
                  alt={`Product ${title}`}
                  onError={(e) => {
                    if (heroSrc !== DEFAULT_PRODUCT_IMAGE) {
                      setHeroSrc(DEFAULT_PRODUCT_IMAGE);
                    }
                  }}
                />
              </div>
            </div>

            <StatsCards stats={stats} />

            {(() => {
              const row = [
                stats?.histogram ? <HistogramChart key="hist" histogram={stats.histogram} /> : null,
                stats?.perSource ? <SourceBreakdownChart key="src" perSource={stats.perSource} /> : null,
              ].filter(Boolean);
              if (!row.length) return null;
              const layoutClass = row.length === 1 ? "charts single" : "charts wide";
              return <div className={`grid ${layoutClass}`}>{row}</div>;
            })()}

            {(() => {
              const hasTrend = Array.isArray(stats?.trend) && stats.trend.length > 0;
              const hasStatus = Boolean(stats?.statusCounts);
              const row = [
                hasTrend ? <TrendChart key="trend" data={stats.trend} /> : null,
                hasStatus ? <StatusChart key="status" statusCounts={stats.statusCounts} /> : null,
              ].filter(Boolean);
              if (!row.length) return null;
              const layoutClass = row.length === 1 ? "charts single" : "charts wide";
              return <div className={`grid ${layoutClass}`}>{row}</div>;
            })()}

            <FilterBar perSource={stats?.perSource} active={activeSources} onChange={setActiveSources} />

            <ReviewTable reviews={filteredReviews} onFlagReview={flagReview} />
          </>
        )}

        {activeTab === "admin" && (
          <AdminPanel reviews={flaggedQueue} onModerate={moderateReview} loading={queueLoading} />
        )}

        {activeTab === "catalog" && (
          <ProductManager
            products={products}
            form={productForm}
            onChange={setProductForm}
            onSubmit={handleAddProduct}
            onDelete={handleDeleteProduct}
            submitting={savingProduct}
          />
        )}

        {loading && (
          <div className="overlay">
            <div className="spinner" />
          </div>
        )}

        {/* Toast (single) */}
        <Toast toast={toast} onClose={() => setToast(null)} />
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-col">
            <h4>VVAP</h4>
            <p>Aggregating gaming laptop reviews from multiple sources to help you decide faster.</p>
          </div>

          <div className="footer-col">
            <h5>Sources</h5>
            <ul>
              <li>Amazon</li>
              <li>BestBuy</li>
              <li>Newegg</li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>Features</h5>
            <ul>
              <li>Review statistics</li>
              <li>Source breakdown</li>
              <li>Rating distribution</li>
            </ul>
          </div>

          <div className="footer-col">
            <h5>About</h5>
            <ul>
              <li>Built with React, Express, and MySQL</li>
              <li>© {new Date().getFullYear()} VVAP Aggregator</li>
            </ul>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-team">
          <div className="footer-team-title">Project Team</div>
          <div className="footer-team-list">
            <span>Nguyen Cong Phuc</span>
            <span>•</span>
            <span>Hoang Huu Viet</span>
            <span>•</span>
            <span>Dang Thuy An</span>
            <span>•</span>
            <span>Le Duc Minh Vuong</span>
