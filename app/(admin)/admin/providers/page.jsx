"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("providers");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadProviders() {
    try {
      const [providersResponse, usersResponse] = await Promise.all([
        fetch("/api/providers?includeAll=1"),
        fetch("/api/users?page=1&limit=1"),
      ]);
      const providersData = await providersResponse.json();
      const usersData = await usersResponse.json();
      if (!providersResponse.ok) throw new Error(providersData.error || "Failed to fetch providers");
      if (!usersResponse.ok) throw new Error(usersData.error || "Failed to fetch users");
      setProviders(Array.isArray(providersData) ? providersData : []);
      setUsersTotal(usersData.totalUsers || 0);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadProviders();
  }, []);

  async function updateProviderStatus(providerId, action) {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/providers/${providerId}/${action}`, { method: "PATCH" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${action} provider`);
      setMessage(data.message || `Provider ${action}d`);
      await loadProviders();
    } catch (err) {
      setError(err.message);
    }
  }

  const summary = useMemo(() => {
    const totalProviders = providers.length;
    const blocked = providers.filter((item) => item.status === "blocked" || item.blocked).length;
    const lowReliability = providers.filter((item) => Number(item.reliabilityScore || 0) < 80).length;
    const flagged = providers.filter((item) => Number(item.flaggedCount || 0) > 0).length;
    const avgReliability = totalProviders
      ? Math.round(providers.reduce((sum, item) => sum + Number(item.reliabilityScore || 0), 0) / totalProviders)
      : 0;
    return { totalProviders, blocked, lowReliability, flagged, avgReliability };
  }, [providers]);

  const visibleProviders = useMemo(() => {
    const q = query.toLowerCase().trim();
    return providers.filter((item) => {
      if (tab === "flagged" && Number(item.flaggedCount || 0) === 0) return false;
      if (tab === "overview") return true;
      const haystack = `${item.businessName || ""} ${item.location || ""} ${(item.services || []).join(" ")}`.toLowerCase();
      return !q || haystack.includes(q);
    });
  }, [providers, query, tab]);

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-4">
        <section className="sv-card p-5">
          <h1 className="sv-title">Admin Control Center</h1>
          <p className="sv-subtitle mt-2">Platform management and provider monitoring.</p>
          {message ? <p className="text-green-700 mt-2">{message}</p> : null}
          {error ? <p className="text-red-700 mt-2">{error}</p> : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-5">
          <div className="sv-card p-4"><p className="sv-subtitle">Total Providers</p><p className="text-3xl font-bold">{summary.totalProviders}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Total Users</p><p className="text-3xl font-bold">{usersTotal}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Blocked Providers</p><p className="text-3xl font-bold">{summary.blocked}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Low Reliability</p><p className="text-3xl font-bold">{summary.lowReliability}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Avg Reliability</p><p className="text-3xl font-bold">{summary.avgReliability}%</p></div>
        </section>

        <section className="sv-card p-4">
          <input className="sv-input" placeholder="Search providers by name, location, or service..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {[
              ["overview", "Overview"],
              ["providers", "Providers"],
              ["flagged", `Flagged (${summary.flagged})`],
            ].map(([id, label]) => (
              <button key={id} className="sv-btn-secondary" style={{ background: tab === id ? "rgba(201,75,44,0.12)" : "#fff" }} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          {visibleProviders.map((provider) => (
            <div key={provider._id} className="sv-card p-4">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                <div>
                  <h3 style={{ fontWeight: 700 }}>{provider.businessName}</h3>
                  <p className="sv-subtitle">{provider.location || "-"}</p>
                  <div style={{ display: "grid", gap: 8, marginTop: 10, gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
                    <div className="sv-card p-2"><p className="sv-subtitle">Accept Rate</p><p style={{ fontWeight: 700 }}>{provider.acceptRate || 0}%</p></div>
                    <div className="sv-card p-2"><p className="sv-subtitle">Cancellations</p><p style={{ fontWeight: 700 }}>{provider.cancellations || 0}</p></div>
                    <div className="sv-card p-2"><p className="sv-subtitle">Cancel Rate</p><p style={{ fontWeight: 700 }}>{provider.rejectRate || 0}%</p></div>
                    <div className="sv-card p-2"><p className="sv-subtitle">Status</p><p style={{ fontWeight: 700 }}>{provider.status}</p></div>
                  </div>
                </div>
                <span className="sv-pill">{provider.reliabilityScore || 0}% Reliability</span>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="sv-btn-secondary">View Profile</button>
                <button className="sv-btn-secondary" onClick={() => updateProviderStatus(provider._id, "flag")}>Flag Account</button>
                <button className="sv-btn-secondary" onClick={() => updateProviderStatus(provider._id, "warn")}>Send Warning</button>
                <button className="sv-btn" onClick={() => updateProviderStatus(provider._id, "approve")}>Approve</button>
                <button className="sv-btn-secondary" style={{ color: "#a81437" }} onClick={() => updateProviderStatus(provider._id, "block")}>Block Provider</button>
              </div>
            </div>
          ))}
          {!visibleProviders.length ? <div className="sv-card p-4">No providers found for this view.</div> : null}
        </section>
      </div>
    </main>
  );
}
