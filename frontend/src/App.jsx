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
  "acer-predator-helios-300":
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
  "msi-raider-ge78":
    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?auto=format&fit=crop&w=1200&q=80",
  "alienware-m16":
    "https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=1200&q=80",
  "hp-omen-16":
    "https://images.unsplash.com/photo-1472220625704-91e1462799b2?auto=format&fit=crop&w=1200&q=80",
};
const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1481277542470-605612bd2d61?auto=format&fit=crop&w=1200&q=80";

export default function App() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [selected, setSelected] = useState(FALLBACK_PRODUCTS[0].id);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeSources, setActiveSources] = useState([]);
  const [toast, setToast] = useState(null);

  const API = useMemo(
    () => (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, ""),
    [],
  );

  const normalizeAggregate = (agg) => {
    if (!agg) return null;
    const perSource = (agg.by_source || []).reduce((acc, s) => {
      acc[s.source] = { average: s.average_rating, count: s.review_count };
      return acc;
    }, {});
    const histogramArr = [1, 2, 3, 4, 5].map((n) => agg.rating_histogram?.[String(n)] || 0);
    return {
      count: agg.overall?.total_reviews ?? 0,
      average: Number(agg.overall?.average_rating ?? 0),
      perSource,
      histogram: histogramArr,
    };
  };

  async function fetchReviews() {
    try {
      if (!selected) return;
      setLoading(true);
      const [res, agg] = await Promise.all([
        axios.get(`${API}/api/products/${selected}/reviews`),
        axios.get(`${API}/api/products/${selected}/aggregate`),
      ]);
      const reviewsData = res.data?.data ?? res.data ?? [];
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
  }

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await axios.get(`${API}/api/products`);
        const list = res.data?.data ?? res.data ?? [];
        const normalized = list
          .map((p) => ({
            id: p.id || p.product_id || String(p),
            name: p.name || p.product_id || String(p),
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
    }
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selected) || { id: selected, name: selected },
    [products, selected],
  );
  const title = selectedProduct?.name || selected;
  const productImage = PRODUCT_IMAGES[selectedProduct.id] || DEFAULT_PRODUCT_IMAGE;

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-inner">
          <h1>Gaming Laptop Review Aggregator</h1>
          <div className="controls">
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
              {loading ? "Fetching…" : "Fetch Reviews"}
            </button>
          </div>
        </div>
      </header>

      <section className="content">
        <div className="product-hero card">
          <div className="product-hero-text">
            <div className="label">Selected product</div>
            <h2 className="product-hero-title">{title}</h2>
            <p className="product-hero-sub">Showing live reviews from your database.</p>
          </div>
          <div className="product-hero-image" aria-hidden="true">
            <img src={productImage} alt={`Product ${title}`} />
          </div>
        </div>

        <StatsCards stats={stats} />

        <div className="grid charts">
          <HistogramChart histogram={stats?.histogram} />
          <SourceBreakdownChart perSource={stats?.perSource} />
        </div>

        <FilterBar
          perSource={stats?.perSource}
          active={activeSources}
          onChange={setActiveSources}
        />

        <ReviewTable
          reviews={
            activeSources.length
              ? reviews.filter((r) => activeSources.includes(r.source))
              : []
          }
        />

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
            <span>Nguyễn Công Phúc</span>
            <span>•</span>
            <span>Hoàng Hữu Việt</span>
            <span>•</span>
            <span>Đặng Thuý An</span>
            <span>•</span>
            <span>Lê Đức Minh Vương</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
