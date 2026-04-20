"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";

function formatMoney(value) {
  const num = Number(value || 0);
  return `Rs ${Number.isFinite(num) ? num : 0}`;
}

export default function AdminProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params?.id;

  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProvider() {
      if (!providerId) return;
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/providers/${providerId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch provider profile");
        if (!active) return;
        setProvider(data);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Could not load provider.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProvider();
    return () => {
      active = false;
    };
  }, [providerId]);

  const derived = useMemo(() => {
    const services = Array.isArray(provider?.services) ? provider.services : [];
    const serviceTitles = services
      .map((item) => (typeof item === "string" ? item : item?.title))
      .filter(Boolean);

    const firstServiceObject = services.find((item) => item && typeof item === "object");
    const serviceImage = firstServiceObject?.serviceImages?.[0] || provider?.avatarUrl || "";
    const basePrice = firstServiceObject?.price ?? provider?.basePrice ?? 0;
    const bookingCharge = provider?.bookingCharge ?? 0;
    const consultationFee = provider?.consultationFee ?? 0;
    const serviceFee = provider?.serviceFee ?? 0;
    const total = Number(basePrice || 0) + Number(bookingCharge || 0) + Number(consultationFee || 0) + Number(serviceFee || 0);

    return {
      serviceImage,
      serviceTitles,
      basePrice,
      bookingCharge,
      consultationFee,
      serviceFee,
      total,
      rating: Number(provider?.avgRating || 0).toFixed(1),
      reliability: Number(provider?.reliabilityScore || 0),
      bookings: Number(provider?.totalBookings || 0),
      acceptRate: Number(provider?.acceptRate || 0),
      cancellations: Number(provider?.cancellations || 0),
    };
  }, [provider]);

  return (
    <>
      <style>{`
        .app-page {
          min-height: 100vh;
          background: #fef3f4;
          font-family: "Trebuchet MS", "Segoe UI", "Helvetica Neue", sans-serif;
          color: #1f2937;
          line-height: 1.45;
        }
        .app-shell { max-width: 980px; margin: 0 auto; padding: 24px 18px 64px; }

        .app-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .app-back {
          border: 1px solid #fecaca;
          background: #fff;
          color: #7f1d1d;
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .app-back:hover { background: #fff1f2; }

        .app-card {
          background: #fff;
          border: 1px solid #fecaca;
          border-radius: 12px;
        }

        .app-profile {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 14px;
          overflow: hidden;
        }
        .app-media {
          min-height: 240px;
          border-right: 1px solid #fee2e2;
          background: linear-gradient(145deg, #fecdd3, #fda4af);
          display: grid;
          place-items: center;
        }
        .app-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .app-media-fallback {
          color: #7f1d1d;
          font-size: 15px;
          font-weight: 700;
          text-align: center;
          padding: 20px;
        }
        .app-main {
          padding: 18px 16px 16px 0;
        }
        .app-name { font-size: 34px; line-height: 1.08; margin: 0 0 4px; color: #111827; letter-spacing: -0.01em; }
        .app-loc { font-size: 15px; color: #6b7280; margin: 0 0 8px; }
        .app-line { margin: 0 0 4px; color: #1f2937; font-size: 15px; }
        .app-services { margin: 8px 0 12px; color: #1f2937; font-size: 15px; }

        .app-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }
        .app-stat {
          border: 1px solid #fee2e2;
          border-radius: 14px;
          padding: 10px 12px;
          background: #fff;
        }
        .app-stat-label { font-size: 13px; color: #6b7280; font-weight: 600; }
        .app-stat-val { font-size: 26px; line-height: 1; font-weight: 800; color: #111827; margin-top: 4px; }

        .app-bottom {
          margin-top: 12px;
          display: grid;
          grid-template-columns: 1.2fr .8fr;
          gap: 12px;
        }
        .app-panel {
          padding: 20px;
          min-height: 172px;
        }
        .app-panel h3 { margin: 0 0 8px; font-size: 28px; color: #111827; letter-spacing: -0.01em; }
        .app-panel p { margin: 0 0 14px; color: #4b5563; font-size: 16px; }
        .app-cta {
          border: none;
          background: #e11d48;
          color: #fff;
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }
        .app-cta:hover { background: #be123c; }

        .app-price-title { margin: 0 0 8px; font-size: 27px; color: #111827; letter-spacing: -0.01em; }
        .app-price-line {
          font-size: 16px;
          color: #374151;
          margin-bottom: 6px;
        }
        .app-price-total {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #f3d5d8;
          font-size: 22px;
          font-weight: 800;
          color: #111827;
        }
        .app-note {
          margin-top: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .app-loading, .app-error {
          margin-top: 14px;
          background: #fff;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 16px;
          color: #7f1d1d;
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .app-profile {
            grid-template-columns: 1fr;
          }
          .app-media {
            min-height: 220px;
            border-right: none;
            border-bottom: 1px solid #fee2e2;
          }
          .app-main {
            padding: 14px;
          }
          .app-bottom {
            grid-template-columns: 1fr;
          }
          .app-name { font-size: 30px; }
          .app-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .app-panel h3 { font-size: 24px; }
          .app-panel p { font-size: 15px; }
          .app-cta { font-size: 15px; }
          .app-price-line { font-size: 15px; }
          .app-price-total { font-size: 21px; }
          .app-price-title { font-size: 24px; }
        }
      `}</style>

      <main className="app-page">
        <AppNav />
        <div className="app-shell">
          <div className="app-top">
            <button className="app-back" onClick={() => router.push("/admin/providers")}>
              ← Back To Providers
            </button>
          </div>

          {loading && <div className="app-loading">Loading provider profile...</div>}
          {error && <div className="app-error">{error}</div>}

          {!loading && !error && provider && (
            <>
              <section className="app-card app-profile">
                <div className="app-media">
                  {derived.serviceImage ? (
                    <img src={derived.serviceImage} alt={provider.businessName || "Provider"} />
                  ) : (
                    <div className="app-media-fallback">Provider Service Preview</div>
                  )}
                </div>

                <div className="app-main">
                  <h1 className="app-name">{provider.businessName || "Provider"}</h1>
                  <p className="app-loc">{provider.location || "Location not set"}</p>
                  <p className="app-line">Rating: {derived.rating}</p>
                  <p className="app-line">Reliability: {derived.reliability}</p>
                  <p className="app-services">
                    Services: {derived.serviceTitles.length ? derived.serviceTitles.join(", ") : "No services listed"}
                  </p>

                  <div className="app-stats">
                    <div className="app-stat">
                      <div className="app-stat-label">Bookings</div>
                      <div className="app-stat-val">{derived.bookings}</div>
                    </div>
                    <div className="app-stat">
                      <div className="app-stat-label">Accept Rate</div>
                      <div className="app-stat-val">{derived.acceptRate}%</div>
                    </div>
                    <div className="app-stat">
                      <div className="app-stat-label">Reliability</div>
                      <div className="app-stat-val">{derived.reliability}%</div>
                    </div>
                    <div className="app-stat">
                      <div className="app-stat-label">Cancellations</div>
                      <div className="app-stat-val">{derived.cancellations}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="app-bottom">
                <div className="app-card app-panel">
                  <h3>Ready To Review?</h3>
                  <p>Continue to provider controls for approve, block, warn, and flag actions.</p>
                  <button className="app-cta" onClick={() => router.push("/admin/providers")}>
                    Continue To Management
                  </button>
                </div>

                <div className="app-card app-panel">
                  <h3 className="app-price-title">Pricing Breakdown</h3>
                  <div className="app-price-line">Base Price: {formatMoney(derived.basePrice)}</div>
                  <div className="app-price-line">Booking Charge: {formatMoney(derived.bookingCharge)}</div>
                  <div className="app-price-line">Consultation: {formatMoney(derived.consultationFee)}</div>
                  <div className="app-price-line">Service Fee: {formatMoney(derived.serviceFee)}</div>
                  <div className="app-price-total">Total: {formatMoney(derived.total)}</div>
                  <div className="app-note">Verified provider with live reliability scoring.</div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
