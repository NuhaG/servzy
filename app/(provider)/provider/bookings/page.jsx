"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";

export default function ProviderBookingsPage() {
  const [provider, setProvider] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState("requests");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadBookings = useCallback(async (providerId) => {
    if (!providerId) return;
    try {
      const response = await fetch(`/api/bookings?providerId=${encodeURIComponent(providerId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch bookings");
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    async function loadPage() {
      try {
        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();
        if (!meResponse.ok) throw new Error(meData.error || "Failed to load provider");
        if (!meData.provider?._id) throw new Error("Provider profile not found for this account");
        setProvider(meData.provider);
        await loadBookings(meData.provider._id);
      } catch (err) {
        setError(err.message);
      }
    }
    loadPage();
  }, [loadBookings]);

  async function updateStatus(bookingId, status) {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update status");
      setMessage(`Booking updated to ${data.status}`);
      await loadBookings(provider?._id);
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return bookings
      .filter((item) => (statusFilter === "all" ? true : item.status === statusFilter))
      .filter((item) => {
        if (tab === "requests") return item.status === "pending";
        if (tab === "upcoming") return item.status === "accepted";
        if (tab === "history") return ["completed", "rejected", "cancelled"].includes(item.status);
        return true;
      })
      .filter((item) => {
        const customer = item.userId?.name?.toLowerCase() || "";
        const service = item.serviceId?.title?.toLowerCase() || "";
        return !q || customer.includes(q) || service.includes(q);
      });
  }, [bookings, query, statusFilter, tab]);

  const stats = useMemo(() => {
    const pending = bookings.filter((item) => item.status === "pending").length;
    const accepted = bookings.filter((item) => item.status === "accepted").length;
    const completed = bookings.filter((item) => item.status === "completed").length;
    const cancellations = bookings.filter((item) => item.status === "cancelled").length;
    const revenue = bookings.filter((item) => item.status === "completed").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const acceptRate = pending + completed ? Math.round(((accepted + completed) / bookings.length) * 100) : 0;
    return { pending, accepted, completed, cancellations, revenue, acceptRate };
  }, [bookings]);

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-4">
        <section className="sv-card p-5">
          <h1 className="sv-title">Provider Operations</h1>
          <p className="sv-subtitle mt-2">{provider ? `${provider.businessName} in ${provider.location || "your city"}` : "Loading provider..."}</p>
          {message ? <p className="text-green-700 mt-2">{message}</p> : null}
          {error ? <p className="text-red-700 mt-2">{error}</p> : null}
        </section>

        <section className="sv-card p-4" style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 220px" }}>
          <input className="sv-input" placeholder="Search customer or service..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <input className="sv-input" value={provider?.businessName || ""} disabled />
          <select className="sv-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </section>

        <section className="grid gap-3 sm:grid-cols-4">
          <div className="sv-card p-4"><p className="sv-subtitle">Reliability Score</p><p className="text-3xl font-bold">{provider?.reliabilityScore || 0}%</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Estimated Revenue</p><p className="text-3xl font-bold">Rs {stats.revenue}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Upcoming</p><p className="text-3xl font-bold">{stats.accepted}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Accept Rate</p><p className="text-3xl font-bold">{stats.acceptRate}%</p></div>
        </section>

        <section className="sv-card p-4">
          <div style={{ display: "flex", gap: 8 }}>
            {[
              ["requests", `Requests (${stats.pending})`],
              ["upcoming", `Upcoming (${stats.accepted})`],
              ["history", `History (${stats.completed + stats.cancellations})`],
            ].map(([id, label]) => (
              <button key={id} className="sv-btn-secondary" style={{ background: tab === id ? "rgba(201,75,44,0.12)" : "#fff" }} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          {filtered.map((booking) => (
            <div key={booking._id} className="sv-card p-4">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <h3 style={{ fontWeight: 700 }}>{booking.userId?.name || "Customer"}</h3>
                  <p className="sv-subtitle">{booking.serviceId?.title || "Service"}</p>
                  <p className="sv-subtitle">{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "-"} | {booking.timeSlot}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "#c94b2c", fontWeight: 800, fontSize: 24 }}>Rs {booking.amount || 0}</p>
                  <span className="sv-pill">{booking.status}</span>
                </div>
              </div>

              {booking.status === "pending" ? (
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button onClick={() => updateStatus(booking._id, "accepted")} className="sv-btn">Accept Booking</button>
                  <button onClick={() => updateStatus(booking._id, "rejected")} className="sv-btn-secondary" style={{ color: "#a81437" }}>Reject</button>
                </div>
              ) : null}
              {booking.status === "accepted" ? (
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button onClick={() => updateStatus(booking._id, "completed")} className="sv-btn">Mark Completed</button>
                  <button onClick={() => updateStatus(booking._id, "cancelled")} className="sv-btn-secondary" style={{ color: "#a81437" }}>Cancel</button>
                </div>
              ) : null}
            </div>
          ))}
          {!filtered.length ? <div className="sv-card p-4">No bookings for this view.</div> : null}
        </section>
      </div>
    </main>
  );
}

