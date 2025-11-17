import { useState } from "react";
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

  const API = import.meta.env.VITE_API_URL;

  async function fetchReviews() {
    try {
      setLoading(true);
      await axios.post(`${API}/api/products/${selected}/fetch`);
      const [res, agg] = await Promise.all([
        axios.get(`${API}/api/products/${selected}/reviews`),
        axios.get(`${API}/api/products/${selected}/aggregate`),
      ]);
      setReviews(res.data);
      setStats(agg.data);
      setActiveSources(Object.keys(agg.data?.perSource || {}));
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
        <span>Built with React + Recharts • {new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
