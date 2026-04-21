"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";

function getProviderImage(provider, service) {
  // Always use provider avatar/photo for services
  if (provider?.avatarUrl) {
    return provider.avatarUrl;
  }
  // Check for 'photo' field (from seed data)
  if (provider?.photo) {
    return provider.photo;
  }
  // Fall back to placeholder
  return `https://i.pravatar.cc/1000?u=${encodeURIComponent(provider?._id || "provider")}`;
}

function StarDisplay({ rating, size = 14 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ fontSize: size, color: n <= Math.round(rating) ? "#b91c1c" : "#fecaca", lineHeight: 1 }}>★</span>
      ))}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{
      background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 9,
      padding: "10px 11px", position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "#b91c1c", opacity: 0.2 }} />
      <div style={{ fontSize: 15, fontWeight: 800, color: "#111", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 10, color: "#888", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function ProviderDetailsContent() {
  const { providerId } = useParams();
  const searchParams = useSearchParams();
  const serviceIdFromQuery = searchParams.get("serviceId");

  const [provider, setProvider] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPageData() {
      try {
        setError("");
        const provRes = await fetch(`/api/providers/${providerId}`);
        const provData = await provRes.json();
        if (!provRes.ok) throw new Error(provData.error || "Failed to load provider");
        setProvider(provData);

        if (provData.services?.length) {
          const serviceId = provData.services[0]._id;
          const revRes = await fetch(`/api/reviews?serviceId=${encodeURIComponent(serviceId)}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            setReviews(Array.isArray(revData) ? revData : []);
          }
        }

        try {
          const ctxRes = await fetch("/api/me");
          if (ctxRes.ok) {
            const ctxData = await ctxRes.json();
            setCurrentUserId(ctxData.user?._id || "");
          }
        } catch (_) {
          setCurrentUserId("");
        }
      } catch (err) {
        setError(err.message);
      }
    }
    if (providerId) loadPageData();
  }, [providerId]);

  const selectedService = useMemo(() =>
    (provider?.services || []).find((s) => s._id === serviceIdFromQuery) ||
    (provider?.services || [])[0],
    [provider, serviceIdFromQuery]);

  const handleServiceSelect = (serviceId) => {
    // Update URL with selected service
    const newUrl = `/providers/${providerId}?serviceId=${encodeURIComponent(serviceId)}`;
    window.history.replaceState({}, "", newUrl);
  };

  const totalPrice = useMemo(() =>
    Number(selectedService?.price || provider?.basePrice || 0) +
    Number(provider?.bookingCharge || 0) +
    Number(provider?.consultationFee || 0) +
    Number(provider?.serviceFee || 0),
    [selectedService, provider]);

  function statusStyle(status) {
    if (status === "approved" || status === "active") return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
    if (status === "blocked") return { bg: "#fff1f2", color: "#b91c1c", border: "#fecaca" };
    if (status === "pending") return { bg: "#fefce8", color: "#854d0e", border: "#fde68a" };
    return { bg: "#fafafa", color: "#555", border: "#e5e5e5" };
  }

  const sc = statusStyle(provider?.status);
  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) * 10) / 10
    : provider?.avgRating || 0;

  const sectionLabel = {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
    color: "#b91c1c", marginBottom: 12, display: "flex", alignItems: "center", gap: 8,
  };

  const card = {
    background: "#fff", border: "1px solid #fecaca", borderRadius: 14,
    padding: 20, boxShadow: "0 4px 24px rgba(185,28,28,0.05)",
  };

  return (
    <>
      <style>{`
        .pdp-page { min-height:100vh; background:#fef2f2; }
        .pdp-shell { max-width:960px; margin:0 auto; padding:28px 16px 64px; }

        .pdp-back { display:inline-flex; align-items:center; gap:6px; padding:7px 16px; border:1px solid #fecaca; border-radius:8px; background:#fff; color:#b91c1c; font-size:13px; font-weight:600; text-decoration:none; transition:all 0.15s; margin-bottom:14px; }
        .pdp-back:hover { background:#fef2f2; border-color:#b91c1c; }

        /* Hero: photo | details */
        .pdp-hero { background:#fff; border:1px solid #fecaca; border-radius:16px; overflow:hidden; margin-bottom:12px; box-shadow:0 4px 24px rgba(185,28,28,0.05); display:grid; grid-template-columns:340px 1fr; }
        @media(max-width:640px) { .pdp-hero { grid-template-columns:1fr; } }
        .pdp-hero-img { width:100%; height:100%; min-height:280px; object-fit:cover; display:block; }
        .pdp-hero-details { padding:24px; display:flex; flex-direction:column; justify-content:space-between; gap:14px; }

        /* Main layout below hero */
        .pdp-main { display:grid; grid-template-columns:1fr 300px; gap:12px; align-items:start; }
        @media(max-width:680px) { .pdp-main { grid-template-columns:1fr; } }

        /* Right column */
        .pdp-right { display:flex; flex-direction:column; gap:12px; }

        /* Pricing rows */
        .pdp-pr { display:flex; justify-content:space-between; font-size:13px; padding:5px 0; }

        /* Book button */
        .pdp-book-btn { display:block; width:100%; padding:12px; text-align:center; background:#7f1d1d; color:#fff; border-radius:12px; font-size:14px; font-weight:700; text-decoration:none; border:none; cursor:pointer; transition:background 0.15s, transform 0.1s; font-family:inherit; box-shadow:0 4px 16px rgba(127,29,29,0.2); }
        .pdp-book-btn:hover { background:#991b1b; transform:translateY(-1px); }

        /* Review items */
        .pdp-rev-item { padding:12px 0; border-bottom:1px solid #fef2f2; display:flex; gap:11px; }
        .pdp-rev-item:last-child { border-bottom:none; padding-bottom:0; }
        .pdp-rev-av { width:34px; height:34px; border-radius:50%; background:#7f1d1d; color:#fff; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* Stats grid */
        .pdp-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; }
        @media(max-width:400px) { .pdp-stats { grid-template-columns:repeat(2,1fr); } }

        .pdp-error { font-size:13px; color:#b91c1c; background:#fff1f2; border:1px solid #fecaca; border-radius:8px; padding:9px 13px; margin-bottom:12px; }
      `}</style>

      <main className="pdp-page">
        <AppNav />
        <div className="pdp-shell">

          <Link href="/services" className="pdp-back">← Back to Services</Link>

          {error && <p className="pdp-error">{error}</p>}
          {!provider && !error && (
            <div style={{ ...card, textAlign: "center", fontSize: 13, color: "#aaa", padding: 40 }}>
              Loading provider details…
            </div>
          )}

          {provider && (
            <>
              {/* ── Hero: photo left | details right ── */}
              <div className="pdp-hero">
                <img
                  src={getProviderImage(provider)}
                  alt={provider.businessName}
                  className="pdp-hero-img"
                />
                <div className="pdp-hero-details">
                  {/* Top: name, loc, tags, price, rating */}
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#111", letterSpacing: "-0.02em", marginBottom: 3 }}>
                      {provider.businessName}
                    </div>
                    <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                      📍 {provider.location || "Location not specified"}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                        border: `1px solid ${sc.border}`, background: sc.bg, color: sc.color, textTransform: "capitalize"
                      }}>
                        {provider.status || "active"} ✓
                      </span>
                      {(provider.services || []).map((s) => (
                        <span key={s._id} style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                          border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c"
                        }}>
                          {s.title}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: "#b91c1c", letterSpacing: "-0.04em", lineHeight: 1 }}>
                      ₹{totalPrice}
                    </div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2, marginBottom: 10 }}>
                      {selectedService?.title || "Base price"} · starting price
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <StarDisplay rating={avgRating} size={15} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{avgRating}</span>
                      <span style={{ fontSize: 12, color: "#888" }}>
                        ({reviews.length > 0 ? `${reviews.length} review${reviews.length !== 1 ? "s" : ""}` : "No reviews yet"})
                      </span>
                      <span style={{ fontSize: 11, color: "#aaa" }}>·</span>
                      <span style={{ fontSize: 12, color: "#888" }}>{provider.reliabilityScore || 0}% Reliability</span>
                    </div>
                  </div>

                  {/* Bottom: stat cards */}
                  <div className="pdp-stats">
                    <StatCard label="Bookings" value={provider.totalBookings || 0} />
                    <StatCard label="Accept Rate" value={`${provider.acceptRate || 0}%`} />
                    <StatCard label="Reliability" value={`${provider.reliabilityScore || 0}%`} />
                    <StatCard label="Cancellations" value={provider.cancellations || 0} />
                  </div>
                </div>
              </div>

              {/* ── Service Selector ── */}
              {(provider?.services || []).length > 0 && (
                <div style={{
                  background: "#fff",
                  border: "1px solid #fecaca",
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 12,
                  boxShadow: "0 4px 24px rgba(185,28,28,0.05)",
                }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    color: "#b91c1c",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}>
                    Select Service
                    <span style={{ flex: 1, height: 1, background: "#fecaca" }} />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {(provider.services || []).map((svc) => (
                      <button
                        key={svc._id}
                        onClick={() => handleServiceSelect(svc._id)}
                        style={{
                          padding: "10px 16px",
                          border: selectedService?._id === svc._id ? "2px solid #b91c1c" : "1px solid #fecaca",
                          borderRadius: 10,
                          background: selectedService?._id === svc._id ? "#fef2f2" : "#fff",
                          color: selectedService?._id === svc._id ? "#b91c1c" : "#555",
                          fontSize: 13,
                          fontWeight: selectedService?._id === svc._id ? 700 : 600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          fontFamily: "inherit",
                        }}
                        onMouseEnter={(e) => {
                          if (selectedService?._id !== svc._id) {
                            e.target.style.borderColor = "#b91c1c";
                            e.target.style.color = "#b91c1c";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedService?._id !== svc._id) {
                            e.target.style.borderColor = "#fecaca";
                            e.target.style.color = "#555";
                          }
                        }}
                      >
                        <span style={{ marginRight: 6 }}>
                          {svc.category}
                        </span>
                        <span style={{ fontWeight: 700 }}>{svc.title}</span>
                        <span style={{ marginLeft: 8, opacity: 0.7 }}>₹{svc.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Main layout: reviews | right col ── */}
              <div className="pdp-main">

                {/* Reviews */}
                <div style={card}>
                  <div style={sectionLabel}>
                    Customer Reviews
                    {reviews.length > 0 && (
                      <span style={{ fontSize: 11, color: "#888", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                        ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                      </span>
                    )}
                    <span style={{ flex: 1, height: 1, background: "#fecaca" }} />
                  </div>

                  {reviews.length > 0 && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "12px 14px", background: "#fef2f2", border: "1px solid #fecaca",
                      borderRadius: 10, marginBottom: 14
                    }}>
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: 32, fontWeight: 800, color: "#b91c1c", letterSpacing: "-0.04em", lineHeight: 1 }}>
                          {avgRating}
                        </div>
                        <StarDisplay rating={avgRating} size={13} />
                        <div style={{ fontSize: 10, color: "#888", marginTop: 3 }}>out of 5</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = reviews.filter((r) => Math.round(r.rating) === star).length;
                          const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                          return (
                            <div key={star} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                              <span style={{ fontSize: 10, color: "#888", width: 8, textAlign: "right" }}>{star}</span>
                              <span style={{ fontSize: 10, color: "#fecaca" }}>★</span>
                              <div style={{
                                flex: 1, height: 5, background: "#fff", borderRadius: 3,
                                border: "1px solid #fecaca", overflow: "hidden"
                              }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: "#b91c1c", borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 10, color: "#888", width: 26 }}>{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {reviews.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "24px 0" }}>
                      No reviews yet. Be the first to book and review!
                    </p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review._id} className="pdp-rev-item">
                        <div className="pdp-rev-av">
                          {review.userId?.name
                            ? review.userId.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
                            : "U"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 2 }}>
                            {review.userId?.name || "Anonymous"}
                          </div>
                          <StarDisplay rating={review.rating} size={13} />
                          {review.comment && (
                            <p style={{ fontSize: 13, color: "#555", marginTop: 4, lineHeight: 1.55 }}>{review.comment}</p>
                          )}
                          {review.createdAt && (
                            <p style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>
                              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric"
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Right column: pricing + CTA */}
                <div className="pdp-right">

                  {/* Pricing */}
                  <div style={card}>
                    <div style={sectionLabel}>
                      Pricing Breakdown
                      <span style={{ flex: 1, height: 1, background: "#fecaca" }} />
                    </div>
                    <div className="pdp-pr">
                      <span style={{ color: "#888" }}>Base Price</span>
                      <span style={{ fontWeight: 600 }}>₹{selectedService?.price || provider.basePrice || 0}</span>
                    </div>
                    <div className="pdp-pr">
                      <span style={{ color: "#888" }}>Booking Charge</span>
                      <span style={{ fontWeight: 600 }}>₹{provider.bookingCharge || 0}</span>
                    </div>
                    <div className="pdp-pr">
                      <span style={{ color: "#888" }}>Consultation Fee</span>
                      <span style={{ fontWeight: 600 }}>₹{provider.consultationFee || 0}</span>
                    </div>
                    <div className="pdp-pr">
                      <span style={{ color: "#888" }}>Service Fee</span>
                      <span style={{ fontWeight: 600 }}>₹{provider.serviceFee || 0}</span>
                    </div>
                    <div style={{
                      display: "flex", justifyContent: "space-between", fontSize: 17,
                      fontWeight: 800, padding: "10px 0 0", borderTop: "1px solid #fecaca", marginTop: 6
                    }}>
                      <span>Total</span>
                      <span style={{ color: "#b91c1c" }}>₹{totalPrice}</span>
                    </div>
                    <div style={{
                      marginTop: 10, fontSize: 11, color: "#aaa", padding: "6px 10px",
                      background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca"
                    }}>
                      Verified provider with live reliability scoring.
                    </div>
                  </div>

                  {/* CTA below pricing */}
                  <div style={card}>
                    <div style={sectionLabel}>
                      Ready to Book?
                      <span style={{ flex: 1, height: 1, background: "#fecaca" }} />
                    </div>
                    <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
                      Continue to choose your service, date, and time slot.
                    </p>
                    {!currentUserId ? (
                      <Link
                        href={`/sign-in?redirect_url=${encodeURIComponent(`/book?providerId=${providerId}`)}`}
                        className="pdp-book-btn">
                        Sign In to Book
                      </Link>
                    ) : (
                      <Link
                        href={`/book?providerId=${providerId}&serviceId=${encodeURIComponent(selectedService?._id || "")}`}
                        className="pdp-book-btn">
                        Continue to Booking →
                      </Link>
                    )}
                    <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 10 }}>
                      ✓ Verified &nbsp;·&nbsp; ✓ Secure payment &nbsp;·&nbsp; ✓ Instant confirmation
                    </p>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function ProviderDetailsPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", background: "#fef2f2" }}>
        <AppNav />
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 16px" }}>
          <div style={{
            background: "#fff", border: "1px solid #fecaca", borderRadius: 14,
            padding: 40, textAlign: "center", fontSize: 13, color: "#aaa"
          }}>
            Loading provider details…
          </div>
        </div>
      </main>
    }>
      <ProviderDetailsContent />
    </Suspense>
  );
}
