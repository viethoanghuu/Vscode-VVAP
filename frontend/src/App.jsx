import { useMemo, useState } from "react";
import axios from "axios";
import StatsCards from "./components/StatsCards";
import HistogramChart from "./components/HistogramChart";
import SourceBreakdownChart from "./components/SourceBreakdownChart";
import ReviewTable from "./components/ReviewTable";
import Toast from "./components/Toast";
import "./App.css";
import RatingStars from "./components/RatingStars";
import FilterBar from "./components/FilterBar";

const PRODUCTS = [
  { id: "asus-rog-zephyrus-g16", name: "ASUS ROG Zephyrus G16" },
  { id: "lenovo-legion-5-pro", name: "Lenovo Legion 5 Pro" },
  { id: "acer-predator-helios-300", name: "Acer Predator Helios 300" },
  { id: "msi-raider-ge78", name: "MSI Raider GE78" },
  { id: "alienware-m16", name: "Alienware M16" },
  { id: "hp-omen-16", name: "HP Omen 16" },
];

export default function App() {
  const [selected, setSelected] = useState(PRODUCTS[0].id);
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
      setLoading(true);
      await axios.post(`${API}/api/products/${selected}/fetch`);
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

  const title = PRODUCTS.find((p) => p.id === selected)?.name || selected;

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-inner">
          <h1>Gaming Laptop Review Aggregator</h1>
          <div className="controls">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              aria-label="Select product"
            >
              {PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button onClick={fetchReviews} disabled={loading}>
              {loading ? "Fetching…" : "Fetch Reviews"}
            </button>
          </div>
        </div>
      </header>

      <section className="content">
        <h2 className="section-title">{title}</h2>

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
