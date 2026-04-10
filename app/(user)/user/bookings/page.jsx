"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";

function PaymentBadge({ status }) {
  const map = {
    pending: { bg: "#fff7e6", color: "#b45309", label: "Payment Pending" },
    paid: { bg: "#ecfdf5", color: "#065f46", label: "Paid" },
    failed: { bg: "#fef2f2", color: "#991b1b", label: "Payment Failed" },
  };
  const item = map[status] || map.pending;
  return (
    <span className="sv-pill" style={{ background: item.bg, color: item.color }}>
      {item.label}
    </span>
  );
}

function MockPaymentModal({ booking, onSuccess, onFailure, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("confirm");

  async function handlePay(simulateFailure) {
    setLoading(true);
    setStep("processing");
    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      const response = await fetch("/api/payment/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking._id, simulateFailure }),
      });
      const data = await response.json();
      if (data.success) {
        setStep("success");
        setTimeout(() => onSuccess(data), 800);
      } else {
        setStep("failed");
        setTimeout(() => onFailure(data.message), 800);
      }
    } catch {
      setStep("failed");
      setTimeout(() => onFailure("Payment failed. Please retry."), 800);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 20,
      }}
    >
      <div className="sv-card" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
        {step === "confirm" ? (
          <div className="space-y-3">
            <h3 style={{ fontWeight: 700, fontSize: 22 }}>Complete payment</h3>
            <p className="sv-subtitle">Booking #{String(booking._id).slice(-6).toUpperCase()}</p>
            <p style={{ fontWeight: 800, color: "var(--sv-accent)", fontSize: 28 }}>
              Rs {Number(booking.amount || 0)}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="sv-btn" onClick={() => handlePay(false)} disabled={loading}>
                Pay Now
              </button>
              <button
                className="sv-btn-secondary"
                style={{ color: "#991b1b", borderColor: "#fca5a5" }}
                onClick={() => handlePay(true)}
                disabled={loading}
              >
                Simulate Failure
              </button>
              <button className="sv-btn-secondary" onClick={onCancel} disabled={loading}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {step === "processing" ? (
          <div className="space-y-2" style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 700 }}>Processing payment...</p>
            <p className="sv-subtitle">Please wait</p>
          </div>
        ) : null}

        {step === "success" ? (
          <div className="space-y-2" style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 700, color: "#065f46" }}>Payment successful</p>
            <p className="sv-subtitle">Updating booking status...</p>
          </div>
        ) : null}

        {step === "failed" ? (
          <div className="space-y-2" style={{ textAlign: "center" }}>
            <p style={{ fontWeight: 700, color: "#991b1b" }}>Payment failed</p>
            <p className="sv-subtitle">Closing...</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function UserBookingsPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("active");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

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

  useEffect(() => {
    const tabFromQuery = (searchParams.get("tab") || "").toLowerCase();
    if (tabFromQuery === "ongoing" || tabFromQuery === "active") setTab("active");
    if (tabFromQuery === "history") setTab("history");
    if (tabFromQuery === "contracts") setTab("contracts");
  }, [searchParams]);

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

  function openPaymentForBooking(booking) {
    const paymentStatus = booking.paymentStatus || "pending";
    if (!["pending", "failed"].includes(paymentStatus)) return;
    setSelectedBooking(booking);
    setShowPayModal(true);
  }

  async function handlePaySuccess() {
    setShowPayModal(false);
    setSelectedBooking(null);
    setMessage("Payment completed successfully.");
    setError("");
    await loadBookings(user?._id);
  }

  async function handlePayFailure(msg) {
    setShowPayModal(false);
    setSelectedBooking(null);
    setMessage("");
    setError(msg || "Payment failed. Please retry.");
    await loadBookings(user?._id);
  }

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-4">
        <section className="sv-card p-5">
          <h1 className="sv-title">{user?.name || "User"} Booking Hub</h1>
          <p className="sv-subtitle mt-2">Track ongoing services, history, and contracts in one place.</p>
          {error ? <p className="text-red-700 mt-2">{error}</p> : null}
          {message ? <p className="text-green-700 mt-2">{message}</p> : null}
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
              ["active", "Ongoing"],
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
            <div
              key={booking._id}
              className="sv-card p-4"
              style={{
                cursor:
                  tab === "active" && ["pending", "failed"].includes(booking.paymentStatus || "pending")
                    ? "pointer"
                    : "default",
              }}
              onClick={() => {
                if (tab !== "active") return;
                openPaymentForBooking(booking);
              }}
              role={tab === "active" ? "button" : undefined}
              tabIndex={tab === "active" ? 0 : undefined}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                if (tab !== "active") return;
                event.preventDefault();
                openPaymentForBooking(booking);
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "start" }}>
                <div>
                  <h3 style={{ fontWeight: 700 }}>{booking.providerId?.businessName || "Provider"}</h3>
                  <p className="sv-subtitle">{booking.serviceId?.title || "Service"} | {booking.status}</p>
                  <p className="sv-subtitle">{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "-"} | {booking.timeSlot}</p>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="sv-pill">{booking.type}</span>
                    <span className="sv-pill">{booking.status}</span>
                    <PaymentBadge status={booking.paymentStatus || "pending"} />
                  </div>
                  {tab === "active" && ["pending", "failed"].includes(booking.paymentStatus || "pending") ? (
                    <p className="sv-subtitle" style={{ marginTop: 8 }}>
                      Click card to complete payment.
                    </p>
                  ) : null}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "#c94b2c", fontWeight: 800, fontSize: 24 }}>Rs {booking.amount || 0}</p>
                  {tab === "active" && ["pending", "failed"].includes(booking.paymentStatus || "pending") ? (
                    <button
                      className="sv-btn-secondary"
                      style={{ marginTop: 8 }}
                      onClick={(event) => {
                        event.stopPropagation();
                        openPaymentForBooking(booking);
                      }}
                    >
                      Pay Now
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {!visibleBookings.length ? <div className="sv-card p-4">No bookings for this tab.</div> : null}
        </section>
      </div>

      {showPayModal && selectedBooking ? (
        <MockPaymentModal
          booking={selectedBooking}
          onSuccess={handlePaySuccess}
          onFailure={handlePayFailure}
          onCancel={() => {
            setShowPayModal(false);
            setSelectedBooking(null);
          }}
        />
      ) : null}
    </main>
  );
}
