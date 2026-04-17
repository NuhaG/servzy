"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import ProviderMap from "./ProviderMap";

function formatPrice(price, unit) {
  const unitMap = { per_hour: "/hour", per_job: "/job", per_day: "/day" };
  return `₹${Number(price || 0).toLocaleString("en-IN")} ${unitMap[unit] || ""}`.trim();
}

function getServiceImage(service, provider) {
  // Use first service image if available
  if (service?.serviceImages?.[0]) {
    return service.serviceImages[0];
  }
  // Use provider avatar if available
  if (provider?.avatarUrl) {
    return provider.avatarUrl;
  }
  // Check for 'photo' field (from seed data)
  if (provider?.photo) {
    return provider.photo;
  }
  // Fall back to placeholder
  return `https://i.pravatar.cc/320?u=${encodeURIComponent(service?._id || "provider")}`;
}

function VerifiedBadge() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 11, fontWeight: 700, padding: "2px 8px",
      borderRadius: 20, border: "1px solid #bbf7d0",
      background: "#f0fdf4", color: "#15803d",
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      Verified
    </span>
  );
}

function StarRow({ rating }) {
  return (
    <div style={{ display: "flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ fontSize: 12, color: n <= Math.round(rating) ? "#b91c1c" : "#fecaca", lineHeight: 1 }}>★</span>
      ))}
    </div>
  );
}

export default function PublicServicesPage() {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  const [category, setCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState(3000);
  const [minRating, setMinRating] = useState(0);
  const [reliability, setReliability] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("nearest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch("/api/services");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load services");
        setServices(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(services.map((s) => s.category).filter(Boolean))).sort(),
    [services]
  );

  const quickTags = useMemo(
    () => Array.from(new Set(services.map((s) => s.title).filter(Boolean))).slice(0, 8),
    [services]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filteredServices = services.filter((item) => {
      const p = item.providerId || {};
      const rating = Number(p.avgRating || 0);
      const rel = Number(p.reliabilityScore || 0);
      const matchesSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        p.businessName?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q);
      return (
        matchesSearch &&
        (category === "all" || item.category === category) &&
        Number(item.price || 0) <= maxPrice &&
        rating >= minRating &&
        rel >= reliability &&
        (!verifiedOnly || p.status === "approved")
      );
    });

    // Group services by provider
    const providerMap = new Map();
    filteredServices.forEach((service) => {
      const providerId = service.providerId?._id;
      if (!providerId) return;
      if (!providerMap.has(providerId)) {
        providerMap.set(providerId, {
          provider: service.providerId,
          services: [],
          lowestPrice: Infinity,
        });
      }
      const entry = providerMap.get(providerId);
      entry.services.push(service);
      const servicePrice = Number(service.price || 0);
      if (servicePrice < entry.lowestPrice) {
        entry.lowestPrice = servicePrice;
      }
    });

    const providerList = Array.from(providerMap.values());

    // Sort providers
    providerList.sort((a, b) => {
      if (sortBy === "price_low") return a.lowestPrice - b.lowestPrice;
      if (sortBy === "price_high") return b.lowestPrice - a.lowestPrice;
      if (sortBy === "rating") return Number(b.provider?.avgRating || 0) - Number(a.provider?.avgRating || 0);
      return Number(b.provider?.reliabilityScore || 0) - Number(a.provider?.reliabilityScore || 0);
    });

    return providerList;
  }, [services, search, category, maxPrice, minRating, reliability, verifiedOnly, sortBy]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search, category, maxPrice, minRating, reliability, verifiedOnly, sortBy, view]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  const mapProviders = useMemo(() => {
    const deduped = new Map();
    filtered.forEach((entry) => {
      const p = entry.provider || {};
      const lat = Number(p.lat), lng = Number(p.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const key = p._id;
      if (deduped.has(key)) return;
      const serviceTitle = entry.services.map((s) => s.title).join(", ");
      deduped.set(key, { _id: key, businessName: p.businessName, location: p.location, avgRating: p.avgRating, lat, lng, serviceTitle });
    });
    return Array.from(deduped.values());
  }, [filtered]);

  return (
    <>
      <style>{`
        .sp-page { min-height: 100vh; background: #fef2f2; }
        .sp-shell { max-width: 1200px; margin: 0 auto; padding: 28px 16px 64px; }

        /* Header card */
        .sp-header {
          background: #fff; border: 1px solid #fecaca; border-left: 4px solid #b91c1c;
          border-radius: 16px; padding: 24px 28px; margin-bottom: 16px;
          box-shadow: 0 4px 24px rgba(185,28,28,0.05);
        }
        .sp-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #b91c1c; margin-bottom: 4px; }
        .sp-title { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.02em; margin: 0 0 3px; }
        .sp-sub { font-size: 13px; color: #888; margin: 0 0 16px; }

        /* Search row */
        .sp-search-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 12px; }
        .sp-input {
          padding: 9px 13px; border: 1px solid #fecaca; border-radius: 10px;
          font-size: 13px; color: #111; background: #fef2f2; outline: none;
          font-family: inherit; transition: border-color 0.15s;
        }
        .sp-input:focus { border-color: #b91c1c; background: #fff; }
        .sp-select {
          padding: 9px 32px 9px 13px; border: 1px solid #fecaca; border-radius: 10px;
          font-size: 13px; color: #111; background: #fef2f2; outline: none;
          cursor: pointer; appearance: none; font-family: inherit;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23b91c1c' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center;
        }
        .sp-view-toggle { display: inline-flex; border: 1px solid #fecaca; border-radius: 10px; overflow: hidden; margin-left: auto; }
        .sp-view-btn { padding: 8px 18px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; background: #fff; color: #888; transition: all 0.15s; font-family: inherit; }
        .sp-view-btn.active { background: #7f1d1d; color: #fff; }
        .sp-filter-toggle { padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid #fecaca; border-radius: 10px; background: #fff; color: #888; transition: all 0.15s; font-family: inherit; }
        .sp-filter-toggle:hover { border-color: #b91c1c; color: #b91c1c; }

        /* Quick tags */
        .sp-tags { display: flex; flex-wrap: wrap; gap: 7px; }
        .sp-tag { padding: 4px 13px; border: 1px solid #fecaca; border-radius: 20px; font-size: 12px; font-weight: 600; color: #888; background: #fff; cursor: pointer; transition: all 0.15s; }
        .sp-tag:hover { background: #7f1d1d; color: #fff; border-color: #7f1d1d; }

        /* Layout */
        .sp-layout { display: grid; grid-template-columns: 320px 1fr; gap: 14px; align-items: start; }
        @media (max-width: 860px) { .sp-layout { grid-template-columns: 1fr; } }

        /* Filters sidebar */
        .sp-filters {
          background: #fff; border: 1px solid #fecaca; border-radius: 14px;
          padding: 20px; position: sticky; top: 20px;
          box-shadow: 0 4px 24px rgba(185,28,28,0.05);
        }
        .sp-filter-title { font-size: 14px; font-weight: 700; color: #111; margin-bottom: 16px; }
        .sp-filter-label { font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #b91c1c; margin-bottom: 6px; display: block; }
        .sp-filter-group { margin-bottom: 16px; }
        .sp-range { width: 100%; accent-color: #b91c1c; cursor: pointer; }
        .sp-range-val { font-size: 13px; font-weight: 600; color: #111; }
        .sp-filter-select { width: 100%; padding: 8px 30px 8px 11px; border: 1px solid #fecaca; border-radius: 9px; font-size: 13px; color: #111; background: #fef2f2; outline: none; cursor: pointer; appearance: none; font-family: inherit; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%23b91c1c' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }
        .sp-checkbox-row { display: flex; align-items: center; gap: 9px; cursor: pointer; }
        .sp-checkbox-row input { accent-color: #b91c1c; cursor: pointer; width: 15px; height: 15px; }
        .sp-checkbox-label { font-size: 13px; color: #555; font-weight: 500; }
        .sp-clear-btn { width: 100%; padding: 9px; border: 1px solid #fecaca; border-radius: 9px; background: #fff; color: #b91c1c; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; margin-top: 4px; }
        .sp-clear-btn:hover { background: #fef2f2; }

        /* Result count */
        .sp-count { background: #fff; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 16px; font-size: 13px; color: #888; margin-bottom: 10px; }
        .sp-count strong { color: #111; }

        /* Service cards */
        .sp-card {
          background: #fff; border: 1px solid #fecaca; border-radius: 14px;
          padding: 0; overflow: hidden; margin-bottom: 12px;
          box-shadow: 0 2px 12px rgba(185,28,28,0.04);
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .sp-card:hover { box-shadow: 0 4px 20px rgba(185,28,28,0.10); transform: translateY(-1px); }

        .sp-card-inner { display: grid; grid-template-columns: 140px 1fr; }
        .sp-card-img { width: 100%; height: 100%; min-height: 160px; object-fit: cover; display: block; }
        .sp-card-body { padding: 18px 20px; display: flex; flex-direction: column; justify-content: space-between; }

        .sp-card-top { margin-bottom: 10px; }
        .sp-biz-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 3px; }
        .sp-biz-name { font-size: 16px; font-weight: 800; color: #111; letter-spacing: -0.01em; }
        .sp-service-name { font-size: 12px; color: #888; margin-bottom: 6px; }
        .sp-loc { font-size: 12px; color: #aaa; margin-bottom: 8px; }

        .sp-pills { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
        .sp-pill { font-size: 11px; font-weight:600; padding: 2px 9px; border-radius: 20px; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; }
        .sp-pill-gray { font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 20px; border: 1px solid #e5e5e5; background: #fafafa; color: #555; }

        .sp-card-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .sp-price { font-size: 22px; font-weight: 800; color: #b91c1c; letter-spacing: -0.03em; line-height: 1; }
        .sp-price-lbl { font-size: 11px; color: #aaa; margin-top: 1px; }

        /* Reliability bar */
        .sp-rel-bar { height: 4px; border-radius: 99px; background: #fef2f2; border: 1px solid #fecaca; overflow: hidden; margin-bottom: 12px; }
        .sp-rel-fill { height: 100%; background: linear-gradient(90deg, #b91c1c, #dc143c); border-radius: 99px; }

        /* Actions */
        .sp-actions { display: flex; gap: 7px; flex-wrap: wrap; }
        .sp-btn-primary { padding: 7px 16px; border-radius: 8px; border: none; background: #7f1d1d; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: none; transition: background 0.15s; font-family: inherit; display: inline-block; }
        .sp-btn-primary:hover { background: #991b1b; }
        .sp-btn-secondary { padding: 7px 14px; border-radius: 8px; border: 1px solid #fecaca; background: #fff; color: #b91c1c; font-size: 12px; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.15s; font-family: inherit; display: inline-block; }
        .sp-btn-secondary:hover { background: #fef2f2; border-color: #b91c1c; }

        /* Pagination */
        .sp-pagination { background: #fff; border: 1px solid #fecaca; border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .sp-page-btn { padding: 7px 16px; border-radius: 8px; border: 1px solid #fecaca; background: #fff; color: #b91c1c; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .sp-page-btn:hover:not(:disabled) { background: #7f1d1d; color: #fff; border-color: #7f1d1d; }
        .sp-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sp-page-info { font-size: 13px; color: #888; }

        .sp-empty { background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 36px; text-align: center; font-size: 13px; color: #aaa; }
        .sp-error { background: #fff1f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; font-size: 13px; color: #b91c1c; }
      `}</style>

      <main className="sp-page">
        <AppNav />
        <div className="sp-shell">

          {/* Header */}
          <div className="sp-header">
            <p className="sp-eyebrow">Services</p>
            <h1 className="sp-title">Book Local Services</h1>
            <p className="sp-sub">Compare trusted providers, pricing, and response quality in one place.</p>

            <div className="sp-search-row">
              <input
                className="sp-input"
                style={{ minWidth: 260, flex: 1, maxWidth: 380 }}
                placeholder="Search provider or service..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="sp-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="nearest">Nearest first</option>
                <option value="rating">Highest rating</option>
                <option value="price_low">Price: low to high</option>
                <option value="price_high">Price: high to low</option>
              </select>
              <button className="sp-filter-toggle" onClick={() => setShowFilters((v) => !v)}>
                {showFilters ? "Hide filters" : "Show filters"}
              </button>
              <div className="sp-view-toggle">
                <button className={`sp-view-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>List</button>
                <button className={`sp-view-btn ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}>Map</button>
              </div>
            </div>

            <div className="sp-tags">
              {quickTags.map((tag) => (
                <button key={tag} className="sp-tag" onClick={() => setSearch(tag)}>{tag}</button>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div className="sp-layout" style={{ gridTemplateColumns: showFilters ? "320px 1fr" : "1fr" }}>

            {/* Filters */}
            {showFilters && (
              <aside className="sp-filters">
                <div className="sp-filter-title">Filters</div>

                <div className="sp-filter-group">
                  <span className="sp-filter-label">Category</span>
                  <select className="sp-filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="sp-filter-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span className="sp-filter-label" style={{ marginBottom: 0 }}>Max Price</span>
                    <span className="sp-range-val">₹{maxPrice.toLocaleString("en-IN")}</span>
                  </div>
                  <input className="sp-range" type="range" min={0} max={5000} step={100} value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginTop: 2 }}>
                    <span>₹0</span><span>₹5,000</span>
                  </div>
                </div>

                <div className="sp-filter-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span className="sp-filter-label" style={{ marginBottom: 0 }}>Min Rating</span>
                    <span className="sp-range-val">{minRating.toFixed(1)}+</span>
                  </div>
                  <input className="sp-range" type="range" min={0} max={5} step={0.5} value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginTop: 2 }}>
                    <span>0</span><span>5.0</span>
                  </div>
                </div>

                <div className="sp-filter-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span className="sp-filter-label" style={{ marginBottom: 0 }}>Min Reliability</span>
                    <span className="sp-range-val">{reliability}%</span>
                  </div>
                  <input className="sp-range" type="range" min={0} max={100} step={5} value={reliability}
                    onChange={(e) => setReliability(Number(e.target.value))} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginTop: 2 }}>
                    <span>0%</span><span>100%</span>
                  </div>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-checkbox-row">
                    <input type="checkbox" checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)} />
                    <span className="sp-checkbox-label">Verified providers only</span>
                  </label>
                </div>

                <button className="sp-clear-btn" onClick={() => {
                  setCategory("all"); setMaxPrice(3000); setMinRating(0);
                  setReliability(0); setVerifiedOnly(false); setSortBy("nearest");
                }}>
                  Clear all filters
                </button>
              </aside>
            )}

            {/* Results */}
            <section>
              {!error && (
                <div className="sp-count">
                  <strong>{filtered.length}</strong> provider{filtered.length !== 1 ? "s" : ""} found
                </div>
              )}

              {loading && <div className="sp-empty">Loading services…</div>}

              {error && (
                <div className="sp-error">
                  {error}
                  <div style={{ marginTop: 8 }}>
                    <button className="sp-btn-secondary" onClick={() => window.location.reload()}>Retry</button>
                  </div>
                </div>
              )}

              {!loading && !error && view === "map" && (
                <>
                  <ProviderMap providers={mapProviders} />
                  {!mapProviders.length && (
                    <div className="sp-empty" style={{ marginTop: 10 }}>
                      No provider coordinates available for the current filters.
                    </div>
                  )}
                </>
              )}

              {!loading && !error && view === "list" && (
                <>
                  {paginated.map((entry) => {
                    const provider = entry.provider || {};
                    const services = entry.services || [];
                    const isVerified = provider.status === "approved";
                    const rating = Number(provider.avgRating || 0);
                    const rel = Number(provider.reliabilityScore || 0);
                    const lowestPrice = entry.lowestPrice;
                    const totalLowestPrice =
                      lowestPrice +
                      Number(provider.bookingCharge || 0) +
                      Number(provider.consultationFee || 0) +
                      Number(provider.serviceFee || 0);

                    // Get provider image
                    const providerImage = provider.avatarUrl || provider.photo || `https://i.pravatar.cc/320?u=${encodeURIComponent(provider._id || "provider")}`;

                    return (
                      <div key={provider._id} className="sp-card">
                        <div className="sp-card-inner">
                          <img
                            src={providerImage}
                            alt={provider.businessName}
                            className="sp-card-img"
                          />
                          <div className="sp-card-body">
                            <div className="sp-card-top">
                              <div className="sp-biz-row">
                                <span className="sp-biz-name">{provider.businessName || "Provider"}</span>
                                {isVerified && <VerifiedBadge />}
                              </div>
                              <div className="sp-loc">📍 {provider.location || "Location not specified"}</div>

                              {/* Services list */}
                              <div style={{ marginBottom: 10, marginTop: 8 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#b91c1c", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  Services Offered ({services.length})
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {services.slice(0, 5).map((svc) => (
                                    <Link
                                      key={svc._id}
                                      href={`/providers/${provider._id}?serviceId=${encodeURIComponent(svc._id)}`}
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        padding: "4px 10px",
                                        borderRadius: 18,
                                        border: "1px solid #fecaca",
                                        background: "#fef2f2",
                                        color: "#b91c1c",
                                        textDecoration: "none",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.background = "#7f1d1d";
                                        e.target.style.color = "#fff";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.background = "#fef2f2";
                                        e.target.style.color = "#b91c1c";
                                      }}
                                    >
                                      {svc.title}
                                    </Link>
                                  ))}
                                  {services.length > 5 && (
                                    <span style={{
                                      fontSize: 12,
                                      fontWeight: 600,
                                      padding: "4px 10px",
                                      borderRadius: 18,
                                      border: "1px solid #e5e5e5",
                                      background: "#fafafa",
                                      color: "#888",
                                    }}>
                                      +{services.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="sp-pills">
                                <span className="sp-pill" style={{ background: "#fafafa", color: "#555", borderColor: "#e5e5e5" }}>
                                  ★ {rating.toFixed(1)}
                                </span>
                                <span className="sp-pill" style={{ background: "#fafafa", color: "#555", borderColor: "#e5e5e5" }}>
                                  {rel}% reliable
                                </span>
                              </div>

                              {/* Reliability bar */}
                              <div className="sp-rel-bar">
                                <div className="sp-rel-fill" style={{ width: `${Math.min(rel, 100)}%` }} />
                              </div>
                            </div>

                            <div className="sp-card-bottom">
                              <div>
                                <div className="sp-price">₹{totalLowestPrice.toLocaleString("en-IN")}</div>
                                <div className="sp-price-lbl">from (lowest service)</div>
                              </div>
                              <div className="sp-actions">
                                <Link
                                  href={`/providers/${provider._id}`}
                                  className="sp-btn-primary">
                                  View Profile
                                </Link>
                                <Link
                                  href={`/providers/${provider._id}`}
                                  className="sp-btn-secondary">
                                  More Details
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filtered.length > pageSize && (
                    <div className="sp-pagination">
                      <button className="sp-page-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                        ← Previous
                      </button>
                      <span className="sp-page-info">Page {currentPage} of {totalPages}</span>
                      <button className="sp-page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                        Next →
                      </button>
                    </div>
                  )}

                  {!filtered.length && (
                    <div className="sp-empty">No services match your filters.</div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
