"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";

export default function ProviderBookingsPage() {
  const [provider, setProvider] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState("requests");
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  // Payment confirmation modal
  const [payModal, setPayModal] = useState({ open: false, booking: null });

  function showToast(msg, type = "success") {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 4000);
  }

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
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update status");
      await loadBookings(provider?._id);
      return true;
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
      return false;
    }
  }

  // Called when "Mark Completed" is clicked — show payment modal first
  function openPayModal(booking) {
    setPayModal({ open: true, booking });
  }

  async function confirmComplete() {
    const booking = payModal.booking;
    setPayModal({ open: false, booking: null });
    const ok = await updateStatus(booking._id, "completed");
    if (ok) {
      showToast(
        `✅ Booking completed! Payment of Rs ${booking.amount || 0} received from ${booking.userId?.name || "customer"}.`
      );
    }
  }

  function statusStyle(status) {
    if (status === "accepted") return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
    if (status === "completed") return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
    if (status === "pending") return { bg: "#fefce8", color: "#854d0e", border: "#fde68a" };
    if (status === "rejected" || status === "cancelled") return { bg: "#fff1f2", color: "#b91c1c", border: "#fecaca" };
    return { bg: "#fafafa", color: "#555", border: "#e5e5e5" };
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return bookings
      .filter((b) => statusFilter === "all" ? true : b.status === statusFilter)
      .filter((b) => {
        if (tab === "requests") return b.status === "pending";
        if (tab === "upcoming") return b.status === "accepted";
        if (tab === "history") return ["completed", "rejected", "cancelled"].includes(b.status);
        return true;
      })
      .filter((b) => {
        const customer = b.userId?.name?.toLowerCase() || "";
        const service = b.serviceId?.title?.toLowerCase() || "";
        return !q || customer.includes(q) || service.includes(q);
      });
  }, [bookings, query, statusFilter, tab]);

  const stats = useMemo(() => {
    const pending = bookings.filter((b) => b.status === "pending").length;
    const accepted = bookings.filter((b) => b.status === "accepted").length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const cancellations = bookings.filter((b) => b.status === "cancelled").length;
    const revenue = bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const acceptRate = bookings.length
      ? Math.round(((accepted + completed) / bookings.length) * 100)
      : 0;
    return { pending, accepted, completed, cancellations, revenue, acceptRate };
  }, [bookings]);

  return (
    <>
      <style>{`
        .pb-page { min-height: 100vh; background: #fef2f2; }
        .pb-shell { max-width: 920px; margin: 0 auto; padding: 36px 20px 64px; }

        /* Header */
        .pb-header {
          background: #fff; border: 1px solid #fecaca; border-left: 4px solid #b91c1c;
          border-radius: 12px; padding: 22px 26px; margin-bottom: 14px;
        }
        .pb-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #b91c1c; margin-bottom: 4px; }
        .pb-title { font-size: 22px; font-weight: 700; color: #111; letter-spacing: -0.02em; margin: 0 0 3px; }
        .pb-sub { font-size: 13px; color: #888; }
        .pb-error { font-size: 13px; color: #b91c1c; background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 9px 13px; margin-bottom: 12px; }

        /* Filter bar */
        .pb-filter {
          background: #fff; border: 1px solid #fecaca; border-radius: 12px;
          padding: 16px 20px; margin-bottom: 14px;
          display: grid; gap: 10px; grid-template-columns: 1fr 1fr 200px;
        }
        @media (max-width: 600px) { .pb-filter { grid-template-columns: 1fr; } }
        .pb-input {
          padding: 9px 13px; border: 1px solid #fecaca; border-radius: 9px;
          font-size: 13px; color: #111; background: #fef2f2; outline: none;
          transition: border-color 0.15s;
        }
        .pb-input:focus { border-color: #b91c1c; background: #fff; }
        .pb-input:disabled { color: #aaa; cursor: not-allowed; }
        .pb-select {
          padding: 9px 32px 9px 13px; border: 1px solid #fecaca; border-radius: 9px;
          font-size: 13px; color: #111; background: #fef2f2; outline: none; cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23b91c1c' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
        }

        /* Stats */
        .pb-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
        @media (max-width: 600px) { .pb-stats { grid-template-columns: repeat(2, 1fr); } }
        .pb-stat { background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 18px 20px; position: relative; overflow: hidden; }
        .pb-stat::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; background:#b91c1c; opacity:0.2; }
        .pb-stat-num { font-size: 28px; font-weight: 800; color: #111; letter-spacing: -0.04em; line-height: 1; margin-bottom: 4px; }
        .pb-stat-num.green { color: #15803d; }
        .pb-stat-num.red { color: #b91c1c; }
        .pb-stat-label { font-size: 11px; color: #888; font-weight: 500; }

        /* Tabs */
        .pb-tabs { background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 14px 18px; margin-bottom: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
        .pb-tab { padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #fecaca; background: #fff; color: #888; transition: all 0.15s; }
        .pb-tab.active { background: #7f1d1d; color: #fff; border-color: #7f1d1d; }

        /* Booking cards */
        .pb-card {
          background: #fff; border: 1px solid #fecaca; border-radius: 12px;
          padding: 18px 20px; margin-bottom: 10px; transition: box-shadow 0.15s;
        }
        .pb-card:hover { box-shadow: 0 2px 12px rgba(185,28,28,0.07); }
        .pb-card-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
        .pb-customer { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 2px; }
        .pb-service { font-size: 12px; color: #888; }
        .pb-time { font-size: 12px; color: #888; margin-top: 2px; }
        .pb-amount { font-size: 24px; font-weight: 800; color: #b91c1c; letter-spacing: -0.03em; line-height: 1; }
        .pb-status-pill { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 20px; border: 1px solid; margin-top: 5px; display: inline-block; text-transform: capitalize; }

        /* Actions */
        .pb-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; padding-top: 12px; border-top: 1px solid #fef2f2; }
        .pb-btn { padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid; transition: all 0.15s; white-space: nowrap; }
        .pb-btn-accept { background: #7f1d1d; color: #fff; border-color: #7f1d1d; }
        .pb-btn-accept:hover { background: #991b1b; }
        .pb-btn-complete { background: #15803d; color: #fff; border-color: #15803d; }
        .pb-btn-complete:hover { background: #166534; }
        .pb-btn-reject { background: #fff1f2; color: #b91c1c; border-color: #fecaca; }
        .pb-btn-reject:hover { background: #ffe4e6; }
        .pb-btn-cancel { background: #fff1f2; color: #b91c1c; border-color: #fecaca; }
        .pb-btn-cancel:hover { background: #ffe4e6; }

        .pb-empty { background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 36px; text-align: center; font-size: 13px; color: #aaa; }

        /* ── Payment Modal ── */
        .pb-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
        .pb-modal { background: #fff; border-radius: 14px; border: 1px solid #fecaca; width: 100%; max-width: 400px; overflow: hidden; }
        .pb-modal-head { padding: 20px 22px 16px; border-bottom: 1px solid #fef2f2; border-left: 4px solid #15803d; }
        .pb-modal-icon { font-size: 32px; margin-bottom: 8px; }
        .pb-modal-title { font-size: 16px; font-weight: 700; color: #111; margin: 0 0 3px; }
        .pb-modal-sub { font-size: 13px; color: #888; }
        .pb-modal-body { padding: 20px 22px; }
        .pb-pay-amount { font-size: 36px; font-weight: 800; color: #15803d; letter-spacing: -0.04em; line-height: 1; margin-bottom: 4px; }
        .pb-pay-label { font-size: 13px; color: #888; }
        .pb-pay-from { font-size: 13px; color: #555; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0fdf4; }
        .pb-pay-from strong { color: #111; font-weight: 600; }
        .pb-modal-foot { padding: 14px 22px; border-top: 1px solid #fef2f2; display: flex; gap: 8px; justify-content: flex-end; }
        .pb-modal-cancel { padding: 8px 18px; border-radius: 8px; border: 1px solid #e5e5e5; background: #fff; color: #555; font-size: 13px; font-weight: 600; cursor: pointer; }
        .pb-modal-cancel:hover { border-color: #ccc; }
        .pb-modal-confirm { padding: 8px 20px; border-radius: 8px; border: none; background: #15803d; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
        .pb-modal-confirm:hover { background: #166534; }

        /* Toast */
        .pb-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(12px); background: #1a1a1a; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.2s, transform 0.2s; z-index: 200; border-left: 3px solid #15803d; max-width: 90vw; }
        .pb-toast.error { border-left-color: #b91c1c; }
        .pb-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      `}</style>

      <main className="pb-page">
        <AppNav />
        <div className="pb-shell">

          {/* Header */}
          <div className="pb-header">
            <p className="pb-eyebrow">Provider</p>
            <h1 className="pb-title">Booking Operations</h1>
            <p className="pb-sub">
              {provider ? `${provider.businessName} · ${provider.location || "your city"}` : "Loading provider..."}
            </p>
          </div>

          {error && <p className="pb-error">{error}</p>}

          {/* Filter bar */}
          <div className="pb-filter">
            <input
              className="pb-input"
              placeholder="Search customer or service..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <input className="pb-input" value={provider?.businessName || ""} disabled />
            <select
              className="pb-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Stats */}
          <div className="pb-stats">
            <div className="pb-stat">
              <div className="pb-stat-num green">Rs {stats.revenue.toLocaleString()}</div>
              <div className="pb-stat-label">Estimated Revenue</div>
            </div>
            <div className="pb-stat">
              <div className="pb-stat-num">{provider?.reliabilityScore || 0}%</div>
              <div className="pb-stat-label">Reliability Score</div>
            </div>
            <div className="pb-stat">
              <div className="pb-stat-num">{stats.accepted}</div>
              <div className="pb-stat-label">Upcoming</div>
            </div>
            <div className="pb-stat">
              <div className={`pb-stat-num ${stats.pending > 0 ? "red" : ""}`}>{stats.pending}</div>
              <div className="pb-stat-label">Pending Requests</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="pb-tabs">
            {[
              ["requests", `Requests (${stats.pending})`],
              ["upcoming", `Upcoming (${stats.accepted})`],
              ["history", `History (${stats.completed + stats.cancellations})`],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`pb-tab ${tab === id ? "active" : ""}`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Bookings */}
          {filtered.length === 0 ? (
            <div className="pb-empty">No bookings for this view.</div>
          ) : (
            filtered.map((booking) => {
              const sc = statusStyle(booking.status);
              return (
                <div key={booking._id} className="pb-card">
                  <div className="pb-card-top">
                    <div>
                      <div className="pb-customer">{booking.userId?.name || "Customer"}</div>
                      <div className="pb-service">{booking.serviceId?.title || "Service"}</div>
                      <div className="pb-time">
                        {booking.scheduledDate
                          ? new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}{" "}
                        · {booking.timeSlot || ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="pb-amount">Rs {(booking.amount || 0).toLocaleString()}</div>
                      <span
                        className="pb-status-pill"
                        style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  {/* Pending actions */}
                  {booking.status === "pending" && (
                    <div className="pb-actions">
                      <button
                        className="pb-btn pb-btn-accept"
                        onClick={() => {
                          updateStatus(booking._id, "accepted").then((ok) => {
                            if (ok) showToast(`📋 Booking accepted for ${booking.userId?.name || "customer"}.`);
                          });
                        }}
                      >
                        ✓ Accept Booking
                      </button>
                      <button
                        className="pb-btn pb-btn-reject"
                        onClick={() => {
                          updateStatus(booking._id, "rejected").then((ok) => {
                            if (ok) showToast(`Booking rejected.`, "error");
                          });
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Accepted actions */}
                  {booking.status === "accepted" && (
                    <div className="pb-actions">
                      <button
                        className="pb-btn pb-btn-complete"
                        onClick={() => openPayModal(booking)}
                      >
                        ✓ Mark Completed
                      </button>
                      <button
                        className="pb-btn pb-btn-cancel"
                        onClick={() => {
                          updateStatus(booking._id, "cancelled").then((ok) => {
                            if (ok) showToast(`Booking cancelled.`, "error");
                          });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

        </div>
      </main>

      {/* ── Payment Confirmation Modal ── */}
      {payModal.open && (
        <div className="pb-overlay" onClick={() => setPayModal({ open: false, booking: null })}>
          <div className="pb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pb-modal-head">
              <div className="pb-modal-icon">💰</div>
              <div className="pb-modal-title">Confirm Payment Received</div>
              <div className="pb-modal-sub">Mark this booking as completed once payment is confirmed.</div>
            </div>
            <div className="pb-modal-body">
              <div className="pb-pay-amount">Rs {(payModal.booking?.amount || 0).toLocaleString()}</div>
              <div className="pb-pay-label">Total amount for this booking</div>
              <div className="pb-pay-from">
                Payment from <strong>{payModal.booking?.userId?.name || "customer"}</strong>{" "}
                for <strong>{payModal.booking?.serviceId?.title || "service"}</strong>
              </div>
            </div>
            <div className="pb-modal-foot">
              <button className="pb-modal-cancel" onClick={() => setPayModal({ open: false, booking: null })}>
                Not Yet
              </button>
              <button className="pb-modal-confirm" onClick={confirmComplete}>
                ✓ Payment Received
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`pb-toast ${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </>
  );
}
