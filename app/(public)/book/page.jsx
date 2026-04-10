"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";

// ─── tiny helpers ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending: { bg: "#fff7e6", color: "#b45309", label: "Pending" },
    accepted: { bg: "#ecfdf5", color: "#065f46", label: "Accepted" },
    rejected: { bg: "#fef2f2", color: "#991b1b", label: "Rejected" },
    completed: { bg: "#f0fdf4", color: "#166534", label: "Completed" },
    cancelled: { bg: "#f9fafb", color: "#4b5563", label: "Cancelled" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, color: s.color }} className="sv-pill">
      {s.label}
    </span>
  );
}

function PaymentBadge({ status }) {
  const map = {
    pending: { bg: "#fff7e6", color: "#b45309", label: "Payment Pending" },
    paid: { bg: "#ecfdf5", color: "#065f46", label: "Paid" },
    failed: { bg: "#fef2f2", color: "#991b1b", label: "Payment Failed" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ background: s.bg, color: s.color }} className="sv-pill">
      {s.label}
    </span>
  );
}

// ─── mock payment modal ───────────────────────────────────────────────────────
function MockPaymentModal({ booking, onSuccess, onFailure, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("confirm"); // confirm | processing | done | failed

  async function handlePay(simulateFailure) {
    setLoading(true);
    setStep("processing");

    // small artificial delay so it feels like something is happening
    await new Promise((r) => setTimeout(r, 1800));

    try {
      const res = await fetch("/api/payment/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking._id, simulateFailure }),
      });
      const data = await res.json();

      if (data.success) {
        setStep("done");
        setTimeout(() => onSuccess(data), 1200);
      } else {
        setStep("failed");
        setTimeout(() => onFailure(data.message), 1200);
      }
    } catch {
      setStep("failed");
      setTimeout(
        () => onFailure("Something went wrong. Please try again."),
        1200,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    /* backdrop */
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
      <div
        className="sv-card"
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 32,
          textAlign: "center",
          animation: "fadeUp .25s ease",
        }}
      >
        {/* ── confirm step ── */}
        {step === "confirm" && (
          <>
            {/* mock badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(201,75,44,0.08)",
                borderRadius: 999,
                padding: "4px 12px",
                marginBottom: 20,
                fontSize: 12,
                fontWeight: 700,
                color: "var(--sv-accent)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              🧪 Sandbox / Test Mode
            </div>

            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.4rem",
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              Complete Payment
            </p>
            <p className="sv-subtitle" style={{ marginBottom: 24 }}>
              This is a simulated payment — no real money will be charged.
            </p>

            {/* amount pill */}
            <div
              style={{
                background: "var(--sv-bg)",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 24,
              }}
            >
              <p
                className="sv-subtitle"
                style={{ fontSize: 12, marginBottom: 2 }}
              >
                Total Amount
              </p>
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "var(--sv-accent)",
                }}
              >
                ₹{booking.amount}
              </p>
              <p className="sv-subtitle" style={{ fontSize: 12, marginTop: 2 }}>
                Booking #{String(booking._id).slice(-6).toUpperCase()}
              </p>
            </div>

            {/* fake card display */}
            <div
              style={{
                border: "1px solid var(--sv-border)",
                borderRadius: 12,
                padding: "12px 16px",
                marginBottom: 24,
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 28,
                  borderRadius: 4,
                  background: "linear-gradient(135deg,#c94b2c,#dc143c)",
                  flexShrink: 0,
                }}
              />
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>
                  •••• •••• •••• 4242
                </p>
                <p className="sv-subtitle" style={{ fontSize: 11 }}>
                  Test Card — expires 12/99
                </p>
              </div>
            </div>

            <button
              className="sv-btn"
              style={{ width: "100%", marginBottom: 10, fontSize: 16 }}
              onClick={() => handlePay(false)}
              disabled={loading}
            >
              Pay ₹{booking.amount}
            </button>
            <button
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #fca5a5",
                borderRadius: 10,
                background: "#fef2f2",
                color: "#991b1b",
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 10,
              }}
              onClick={() => handlePay(true)}
              disabled={loading}
            >
              Simulate Failure
            </button>
            <button
              className="sv-btn-secondary"
              style={{ width: "100%" }}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </>
        )}

        {/* ── processing step ── */}
        {step === "processing" && (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                border: "4px solid var(--sv-border)",
                borderTop: "4px solid var(--sv-accent)",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 20px",
              }}
            />
            <p style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 6 }}>
              Processing Payment…
            </p>
            <p className="sv-subtitle">
              Please wait, do not close this window.
            </p>
          </>
        )}

        {/* ── success step ── */}
        {step === "done" && (
          <>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 32,
              }}
            >
              ✅
            </div>
            <p
              style={{ fontWeight: 700, fontSize: "1.2rem", color: "#065f46" }}
            >
              Payment Successful!
            </p>
            <p className="sv-subtitle" style={{ marginTop: 6 }}>
              Redirecting you now…
            </p>
          </>
        )}

        {/* ── failed step ── */}
        {step === "failed" && (
          <>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 32,
              }}
            >
              ❌
            </div>
            <p
              style={{ fontWeight: 700, fontSize: "1.2rem", color: "#991b1b" }}
            >
              Payment Failed
            </p>
            <p className="sv-subtitle" style={{ marginTop: 6 }}>
              Closing in a moment…
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
        @keyframes spin    { to   { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const providerId = searchParams.get("providerId");

  const [provider, setProvider] = useState(null);
  const [currentRole, setCurrentRole] = useState("");
  const [form, setForm] = useState({
    serviceId: "",
    scheduledDate: "",
    timeSlot: "",
    type: "one-time",
  });
  const [createdBooking, setCreatedBooking] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadPage() {
      try {
        setError("");
        if (!providerId) throw new Error("Provider is required.");

        const meRes = await fetch("/api/me");
        const meData = await meRes.json();
        if (!meRes.ok) {
          router.push(
            `/sign-in?redirect_url=${encodeURIComponent(`/book?providerId=${providerId}`)}`,
          );
          return;
        }
        if (meData.user?.role !== "user")
          throw new Error("Only user accounts can create bookings.");
        setCurrentRole(meData.user?.role || "");

        const provRes = await fetch(`/api/providers/${providerId}`);
        const provData = await provRes.json();
        if (!provRes.ok)
          throw new Error(provData.error || "Failed to load provider");
        setProvider(provData);
        if (provData.services?.[0]?._id)
          setForm((p) => ({ ...p, serviceId: provData.services[0]._id }));
      } catch (err) {
        setError(err.message);
      }
    }
    loadPage();
  }, [providerId, router]);

  const serviceOptions = useMemo(() => provider?.services || [], [provider]);
  const selectedService = useMemo(
    () =>
      serviceOptions.find((s) => s._id === form.serviceId) || serviceOptions[0],
    [serviceOptions, form.serviceId],
  );
  const totalAmount = useMemo(
    () =>
      Number(selectedService?.price || provider?.basePrice || 0) +
      Number(provider?.bookingCharge || 0) +
      Number(provider?.consultationFee || 0) +
      Number(provider?.serviceFee || 0),
    [selectedService, provider],
  );

  async function createBooking(event) {
    event.preventDefault();
    setError("");
    setCreatedBooking(null);
    setPaymentDone(false);
    setShowPayModal(false);
    setSubmitting(true);
    try {
      if (currentRole !== "user")
        throw new Error("Only user accounts can create bookings.");
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: form.serviceId,
          scheduledDate: form.scheduledDate,
          timeSlot: form.timeSlot,
          type: form.type,
          notes: "Created from booking page",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");
      setCreatedBooking(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handlePaySuccess() {
    setShowPayModal(false);
    setPaymentDone(true);
  }

  function handlePayFailure(msg) {
    setShowPayModal(false);
    setError(msg || "Payment failed. You can retry from your bookings page.");
  }

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-4">
        {/* header */}
        <section className="sv-card p-5">
          <h1 className="sv-title">Book Service</h1>
          <p className="sv-subtitle mt-2">
            Review details and create your booking. You can pay now or later.
          </p>
          {error ? (
            <div
              style={{
                marginTop: 12,
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 10,
                color: "#991b1b",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          ) : null}
        </section>

        {/* form + summary */}
        {provider ? (
          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
            {/* booking form */}
            <form
              onSubmit={createBooking}
              className="sv-card p-4 grid gap-3 md:grid-cols-2"
            >
              <h2 className="md:col-span-2 text-lg font-semibold">
                Selected Provider
              </h2>
              <p className="md:col-span-2 sv-subtitle">
                {provider.businessName} &nbsp;·&nbsp;{" "}
                {provider.location || "Unknown location"}
              </p>

              <select
                className="sv-input"
                value={form.serviceId}
                onChange={(e) =>
                  setForm({ ...form, serviceId: e.target.value })
                }
                required
              >
                {serviceOptions.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title}
                  </option>
                ))}
              </select>

              <select
                className="sv-input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="one-time">One-time</option>
                <option value="contract">Contract-based</option>
              </select>

              <input
                className="sv-input"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={form.scheduledDate}
                onChange={(e) =>
                  setForm({ ...form, scheduledDate: e.target.value })
                }
                required
              />
              <input
                className="sv-input"
                placeholder="e.g. 10:00 AM"
                value={form.timeSlot}
                onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                required
              />

              <button className="sv-btn md:col-span-2" disabled={submitting}>
                {submitting ? "Creating Booking…" : "Book Now"}
              </button>
            </form>

            {/* price summary */}
            <aside className="sv-card p-4 space-y-2">
              <h3 className="font-semibold">Booking Summary</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Row
                  label="Base Price"
                  value={selectedService?.price || provider.basePrice || 0}
                />
                <Row
                  label="Booking Charge"
                  value={provider.bookingCharge || 0}
                />
                <Row
                  label="Consultation Fee"
                  value={provider.consultationFee || 0}
                />
                <Row label="Service Fee" value={provider.serviceFee || 0} />
              </div>
              <hr
                style={{ borderColor: "var(--sv-border)", margin: "8px 0" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                }}
              >
                <span>Total</span>
                <span style={{ color: "var(--sv-accent)" }}>
                  ₹{totalAmount}
                </span>
              </div>
              <Link
                href={`/providers/${provider._id}`}
                className="sv-btn-secondary"
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  marginTop: 8,
                }}
              >
                ← Back to Provider
              </Link>
            </aside>
          </div>
        ) : !error ? (
          <div
            className="sv-card p-6"
            style={{ textAlign: "center", color: "var(--sv-muted)" }}
          >
            Loading provider details…
          </div>
        ) : null}

        {/* post-payment confirmation */}
        {paymentDone && createdBooking ? (
          <div
            className="sv-card p-6"
            style={{ borderLeft: "4px solid #10b981" }}
          >
            <p
              style={{
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "#065f46",
                marginBottom: 8,
              }}
            >
              🎉 Booking Confirmed & Payment Received
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <StatusBadge status={createdBooking.status} />
              <PaymentBadge status="paid" />
            </div>
            <p className="sv-subtitle" style={{ marginBottom: 16 }}>
              Booking ID: <code>{createdBooking._id}</code>
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link
                href="/user/bookings"
                className="sv-btn"
                style={{ textDecoration: "none" }}
              >
                My Bookings
              </Link>
              <Link
                href={`/providers/${providerId}`}
                className="sv-btn-secondary"
                style={{ textDecoration: "none" }}
              >
                Provider Details
              </Link>
            </div>
          </div>
        ) : null}

        {/* payment failed, booking created but unpaid */}
        {!paymentDone && createdBooking && !showPayModal ? (
          <div
            className="sv-card p-5"
            style={{ borderLeft: "4px solid #f59e0b" }}
          >
            <p style={{ fontWeight: 700, marginBottom: 6 }}>
              Booking created successfully.
            </p>
            <p className="sv-subtitle" style={{ marginBottom: 12 }}>
              Booking ID: <code>{createdBooking._id}</code> — payment is still
              pending. You can pay now or from My Bookings in the Ongoing tab.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="sv-btn" onClick={() => setShowPayModal(true)}>
                Pay Now
              </button>
              <Link
                href="/user/bookings?tab=ongoing"
                className="sv-btn-secondary"
                style={{ textDecoration: "none" }}
              >
                Pay From Dashboard
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {/* mock payment modal */}
      {showPayModal && createdBooking ? (
        <MockPaymentModal
          booking={createdBooking}
          onSuccess={handlePaySuccess}
          onFailure={handlePayFailure}
          onCancel={() => setShowPayModal(false)}
        />
      ) : null}
    </main>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}
    >
      <span className="sv-subtitle">{label}</span>
      <span>₹{value}</span>
    </div>
  );
}
