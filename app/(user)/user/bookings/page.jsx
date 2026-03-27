"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";

export default function UserBookingsPage() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("active");
  const [error, setError] = useState("");

  const loadBookings = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/bookings?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch bookings");
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    async function loadMe() {
      try {
        const response = await fetch("/api/me");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load user");
        setUser(data.user);
        await loadBookings(data.user?._id);
      } catch (err) {
        setError(err.message);
      }
    }
    loadMe();
  }, [loadBookings]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const cancelled = bookings.filter((item) => item.status === "cancelled").length;
    const active = bookings.filter((item) => ["pending", "accepted"].includes(item.status)).length;
    const contracts = bookings.filter((item) => item.type === "contract").length;
    const rating = total ? (5 - (cancelled / total) * 2).toFixed(1) : "5.0";
    return { total, cancelled, active, contracts, rating };
  }, [bookings]);

  const visibleBookings = useMemo(() => {
    if (tab === "active") return bookings.filter((item) => ["pending", "accepted"].includes(item.status));
    if (tab === "history") return bookings.filter((item) => ["completed", "cancelled", "rejected"].includes(item.status));
    return bookings.filter((item) => item.type === "contract");
  }, [bookings, tab]);

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-4">
        <section className="sv-card p-5">
          <h1 className="sv-title">{user?.name || "User"} Booking Hub</h1>
          <p className="sv-subtitle mt-2">Track upcoming services, history, and contracts in one place.</p>
          {error ? <p className="text-red-700 mt-2">{error}</p> : null}
        </section>

        <section className="grid gap-3 sm:grid-cols-4">
          <div className="sv-card p-4"><p className="sv-subtitle">Your Rating</p><p className="text-3xl font-bold">{stats.rating}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Total Bookings</p><p className="text-3xl font-bold">{stats.total}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Cancellations</p><p className="text-3xl font-bold">{stats.cancelled}</p></div>
          <div className="sv-card p-4"><p className="sv-subtitle">Active Contracts</p><p className="text-3xl font-bold">{stats.contracts}</p></div>
        </section>

        <section className="sv-card p-4">
          <div style={{ display: "flex", gap: 8 }}>
            {[
              ["active", "Active"],
              ["history", "History"],
              ["contracts", "Contracts"],
            ].map(([id, label]) => (
              <button key={id} className="sv-btn-secondary" style={{ background: tab === id ? "rgba(201,75,44,0.12)" : "#fff" }} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          {visibleBookings.map((booking) => (
            <div key={booking._id} className="sv-card p-4">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                <div>
                  <h3 style={{ fontWeight: 700 }}>{booking.providerId?.businessName || "Provider"}</h3>
                  <p className="sv-subtitle">{booking.serviceId?.title || "Service"} | {booking.status}</p>
                  <p className="sv-subtitle">{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "-"} | {booking.timeSlot}</p>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="sv-pill">{booking.type}</span>
                    <span className="sv-pill">{booking.status}</span>
                  </div>
                </div>
                <p style={{ color: "#c94b2c", fontWeight: 800, fontSize: 24 }}>Rs {booking.amount || 0}</p>
              </div>
            </div>
          ))}
          {!visibleBookings.length ? <div className="sv-card p-4">No bookings for this tab.</div> : null}
        </section>
      </div>
    </main>
  );
}

