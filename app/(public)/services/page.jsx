"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import ProviderMap from "./ProviderMap";

function formatPrice(price, unit) {
  const unitMap = { per_hour: "/hour", per_job: "/job", per_day: "/day" };
  return `INR ${Number(price || 0).toLocaleString("en-IN")} ${unitMap[unit] || ""}`.trim();
}

function personImage(seed) {
  return `https://i.pravatar.cc/320?u=${encodeURIComponent(seed || "provider")}`;
}

export default function PublicServicesPage() {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("list");
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
    () => Array.from(new Set(services.map((item) => item.category).filter(Boolean))).sort(),
    [services]
  );

  const quickTags = useMemo(() => {
    return Array.from(new Set(services.map((item) => item.title).filter(Boolean))).slice(0, 8);
  }, [services]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const output = services.filter((item) => {
      const provider = item.providerId || {};
      const rating = Number(provider.avgRating || 0);
      const rel = Number(provider.reliabilityScore || 0);
      const matchesSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        provider.businessName?.toLowerCase().includes(q) ||
        provider.location?.toLowerCase().includes(q);
      const matchesCategory = category === "all" || item.category === category;
      const matchesPrice = Number(item.price || 0) <= maxPrice;
      const matchesRating = rating >= minRating;
      const matchesReliability = rel >= reliability;
      const matchesVerified = !verifiedOnly || provider.status === "approved";
      return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesReliability && matchesVerified;
    });

    output.sort((a, b) => {
      if (sortBy === "price_low") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "price_high") return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === "rating") return Number(b.providerId?.avgRating || 0) - Number(a.providerId?.avgRating || 0);
      return Number(b.providerId?.reliabilityScore || 0) - Number(a.providerId?.reliabilityScore || 0);
    });

    return output;
  }, [services, search, category, maxPrice, minRating, reliability, verifiedOnly, sortBy]);

  const mapProviders = useMemo(() => {
    const deduped = new Map();
    filtered.forEach((service) => {
      const provider = service.providerId || {};
      const lat = Number(provider.lat);
      const lng = Number(provider.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const key = provider._id || `${provider.businessName}-${lat}-${lng}`;
      if (deduped.has(key)) return;
      deduped.set(key, {
        _id: key,
        businessName: provider.businessName,
        location: provider.location,
        avgRating: provider.avgRating,
        lat,
        lng,
        serviceTitle: service.title,
      });
    });
    return Array.from(deduped.values());
  }, [filtered]);

  return (
    <main className="sv-page">
      <style>{`
        .svc-layout { display:grid; grid-template-columns: 280px 1fr; gap:16px; }
        @media (max-width: 980px){ .svc-layout { grid-template-columns: 1fr; } }
        .svc-line { height: 6px; border-radius:999px; background: rgba(201,75,44,.16); overflow:hidden; }
        .svc-fill { height:100%; background: linear-gradient(90deg,#c94b2c,#dc143c); }
      `}</style>

      <AppNav />

      <section className="sv-shell space-y-4">
        <div className="sv-card p-5">
          <h1 className="sv-title">Book Local Services</h1>
          <p className="sv-subtitle mt-2">Compare trusted providers, pricing, and response quality in one place.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <input
              className="sv-input"
              style={{ maxWidth: 360 }}
              placeholder="Search provider or service"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="sv-input" style={{ maxWidth: 180 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="nearest">Nearest first</option>
              <option value="rating">Highest rating</option>
              <option value="price_low">Price low to high</option>
              <option value="price_high">Price high to low</option>
            </select>
            <button className="sv-btn-secondary" onClick={() => setShowFilters((v) => !v)}>
              {showFilters ? "Hide filters" : "Show filters"}
            </button>
            <div style={{ marginLeft: "auto", display: "inline-flex", border: "1px solid var(--sv-border)", borderRadius: 10, overflow: "hidden" }}>
              <button className="sv-btn-secondary" style={{ border: 0, borderRadius: 0, background: view === "list" ? "rgba(201,75,44,0.12)" : "#fff" }} onClick={() => setView("list")}>List</button>
              <button className="sv-btn-secondary" style={{ border: 0, borderRadius: 0, background: view === "map" ? "rgba(201,75,44,0.12)" : "#fff" }} onClick={() => setView("map")}>Map</button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickTags.map((tag) => (
              <button key={tag} className="sv-pill" onClick={() => setSearch(tag)}>{tag}</button>
            ))}
          </div>
        </div>

        <div className="svc-layout">
          {showFilters ? (
            <aside className="sv-card p-4 space-y-4" style={{ alignSelf: "start" }}>
              <h2 style={{ fontWeight: 700 }}>Filters</h2>
              <div>
                <p className="sv-subtitle">Service Category</p>
                <select className="sv-input mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <p className="sv-subtitle">Price Range: 0 - {maxPrice}</p>
                <input type="range" min="0" max="5000" step="100" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ width: "100%" }} />
              </div>
              <div>
                <p className="sv-subtitle">Minimum Rating: {minRating.toFixed(1)}+</p>
                <input type="range" min="0" max="5" step="0.5" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} style={{ width: "100%" }} />
              </div>
              <div>
                <p className="sv-subtitle">Minimum Reliability: {reliability}%</p>
                <input type="range" min="0" max="100" step="5" value={reliability} onChange={(e) => setReliability(Number(e.target.value))} style={{ width: "100%" }} />
              </div>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
                Verified providers only
              </label>
              <button
                className="sv-btn-secondary"
                onClick={() => {
                  setCategory("all");
                  setMaxPrice(3000);
                  setMinRating(0);
                  setReliability(0);
                  setVerifiedOnly(false);
                  setSortBy("nearest");
                }}
              >
                Clear filters
              </button>
            </aside>
          ) : null}

          <section className="space-y-3">
            {!error ? (
              <div className="sv-card p-3" style={{ fontSize: 13 }}>
                {filtered.length} providers found
              </div>
            ) : null}

            {loading ? <div className="sv-card p-4">Loading services...</div> : null}
            {error ? (
              <div className="sv-card p-4 text-red-700">
                {error}
                <div style={{ marginTop: 8 }}>
                  <button className="sv-btn-secondary" onClick={() => window.location.reload()}>
                    Retry
                  </button>
                </div>
              </div>
            ) : null}

            {!loading && !error && view === "map" ? (
              <>
                <ProviderMap providers={mapProviders} />
                {!mapProviders.length ? (
                  <div className="sv-card p-3 text-sm text-amber-700">
                    No provider coordinates available for the current filters.
                  </div>
                ) : null}
              </>
            ) : null}

            {!loading && !error && view === "list" ? (
              <div className="space-y-3">
                {filtered.map((service) => {
                  const provider = service.providerId || {};
                  const img = personImage(provider.businessName || service._id);
                  const reliabilityScore = Number(provider.reliabilityScore || 0);
                  return (
                    <div key={service._id} className="sv-card p-3">
                      <div style={{ display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 12, alignItems: "center" }}>
                        <img src={img} alt={service.title} style={{ width: 110, height: 84, objectFit: "cover", borderRadius: 12 }} />
                        <div>
                          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 20 }}>{provider.businessName || "Provider"}</h3>
                          <p className="sv-subtitle">{service.title} | {provider.location || "Unknown location"}</p>
                          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                            <span className="sv-pill">Rating {Number(provider.avgRating || 0).toFixed(1)}</span>
                            <span className="sv-pill">Reliability {reliabilityScore}%</span>
                            <span className="sv-pill">{service.category || "General"}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ color: "#c94b2c", fontWeight: 800, fontSize: 22 }}>Rs {Number(service.price || 0)}</p>
                          <p className="sv-subtitle">starting price</p>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }} className="svc-line">
                        <div className="svc-fill" style={{ width: `${Math.min(reliabilityScore, 100)}%` }} />
                      </div>
                      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link href={`/providers/${provider._id}`} className="sv-btn" style={{ textDecoration: "none" }}>View profile</Link>
                        <button className="sv-btn-secondary">Show on map</button>
                        <button className="sv-btn-secondary">More details</button>
                      </div>
                    </div>
                  );
                })}
                {!filtered.length ? <div className="sv-card p-4">No services match your filters.</div> : null}
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
