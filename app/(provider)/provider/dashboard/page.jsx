"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function ProviderDashboardPage() {
  const router = useRouter();
  const [provider, setProvider] = useState(null);
  const [stats, setStats] = useState({ services: 0, bookings: 0, pending: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();
        if (!meResponse.ok)
          throw new Error(meData.error || "Failed to load account");
        if (meData.user?.role === "user") {
          router.replace("/user/dashboard");
          return;
        }
        if (meData.user?.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }
        if (!meData.provider?._id) {
          const createResponse = await fetch("/api/providers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessName: meData.user?.name
                ? `${meData.user.name} Services`
                : "Provider Services",
            }),
          });
          if (!createResponse.ok) {
            const createData = await createResponse.json().catch(() => ({}));
            const msg =
              createData.error || "Provider profile not found for this account";
            if (!String(msg).toLowerCase().includes("already exists")) {
              throw new Error(msg);
            }
          }
          const meRetryResponse = await fetch("/api/me");
          const meRetryData = await meRetryResponse.json();
          if (!meRetryResponse.ok)
            throw new Error(meRetryData.error || "Failed to load account");
          if (!meRetryData.provider?._id)
            throw new Error("Provider profile not found for this account");
          meData.provider = meRetryData.provider;
        }

        const providerResponse = await fetch(
          `/api/providers/${meData.provider._id}`,
        );
        const providerData = await providerResponse.json();
        if (!providerResponse.ok)
          throw new Error(providerData.error || "Failed to load provider");
        setProvider(providerData);

        const bookingsResponse = await fetch(
          `/api/bookings?providerId=${encodeURIComponent(meData.provider._id)}`,
        );
        const bookingsData = await bookingsResponse.json();
        if (!bookingsResponse.ok)
          throw new Error(bookingsData.error || "Failed to load bookings");

        setStats({
          services: providerData.services?.length || 0,
          bookings: bookingsData.length,
          pending: bookingsData.filter((b) => b.status === "pending").length,
        });
      } catch (err) {
        setError(err.message);
      }
    }

    loadDashboard();
  }, [router]);

  function statusStyle(status) {
    if (status === "approved" || status === "active")
      return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
    if (status === "blocked")
      return { bg: "#fff1f2", color: "#b91c1c", border: "#fecaca" };
    if (status === "pending")
      return { bg: "#fefce8", color: "#854d0e", border: "#fde68a" };
    return { bg: "#fafafa", color: "#555", border: "#e5e5e5" };
  }

  const sc = statusStyle(provider?.status);

  const navLinks = [
    {
      href: "/provider/profile",
      label: "Edit Profile",
      desc: "Update your business info & photo",
      icon: "✏️",
    },
    {
      href: "/provider/services",
      label: "My Services",
      desc: "View and manage your service listings",
      icon: "🛠️",
    },
    {
      href: "/provider/services/new",
      label: "Create Service",
      desc: "Add a new service to your profile",
      icon: "➕",
    },
    {
      href: "/provider/bookings",
      label: "Booking Requests",
      desc: "Review and respond to bookings",
      icon: "📅",
    },
    {
      href: "/provider/complaints",
      label: "Complaints",
      desc: "View complaints raised against you",
      icon: "⚠️",
    },
  ];

  return (
    <>
      <style>{`
        .pd-page { min-height: 100vh; background: #fef2f2; }
        .pd-shell { max-width: 860px; margin: 0 auto; padding: 36px 20px 64px; }

        /* ── Header ── */
        .pd-header {
          background: #fff;
          border: 1px solid #fecaca;
          border-left: 4px solid #b91c1c;
          border-radius: 12px;
          padding: 24px 28px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .pd-header-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #b91c1c;
          margin-bottom: 5px;
        }
        .pd-header-title {
          font-size: 22px;
          font-weight: 700;
          color: #111;
          letter-spacing: -0.02em;
          margin: 0 0 6px;
        }
        .pd-header-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pd-business-name {
          font-size: 13px;
          color: #555;
          font-weight: 500;
        }
        .pd-status-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: 20px;
          border: 1px solid;
          text-transform: capitalize;
        }
        .pd-header-photo {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          object-fit: cover;
          border: 2px solid #fecaca;
          flex-shrink: 0;
        }
        .pd-header-avatar {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          background: #fef2f2;
          border: 2px solid #fecaca;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }
        .pd-loading {
          font-size: 13px;
          color: #aaa;
          font-style: italic;
        }
        .pd-error {
          margin-top: 10px;
          font-size: 13px;
          color: #b91c1c;
          background: #fff1f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 9px 13px;
        }

        /* ── Stats ── */
        .pd-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }
        @media (max-width: 520px) { .pd-stats { grid-template-columns: 1fr; } }
        .pd-stat {
          background: #fff;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 22px 24px 18px;
          position: relative;
          overflow: hidden;
        }
        .pd-stat::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: #b91c1c;
          opacity: 0.2;
        }
        .pd-stat-num {
          font-size: 38px;
          font-weight: 800;
          color: #111;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 5px;
        }
        .pd-stat-num.pending { color: #b91c1c; }
        .pd-stat-label {
          font-size: 12px;
          color: #888;
          font-weight: 500;
        }

        /* ── Nav cards ── */
        .pd-nav {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (max-width: 480px) { .pd-nav { grid-template-columns: 1fr; } }

        .pd-nav-link {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #7f1d1d;
          border: 1px solid #991b1b;
          border-radius: 12px;
          padding: 20px 22px;
          text-decoration: none;
          color: #fff;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
        }
        .pd-nav-link:hover {
          background: #991b1b;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(127, 29, 29, 0.25);
        }
        .pd-nav-link:hover .pd-nav-arrow {
          transform: translateX(4px);
        }

        /* Last card full width if odd */
        .pd-nav-link:last-child:nth-child(odd) {
          grid-column: 1 / -1;
        }

        .pd-nav-icon {
          font-size: 20px;
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.1);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pd-nav-text { flex: 1; min-width: 0; }
        .pd-nav-label {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          display: block;
          margin-bottom: 2px;
        }
        .pd-nav-desc {
          font-size: 12px;
          color: #fca5a5;
          display: block;
        }
        .pd-nav-arrow {
          color: #fca5a5;
          font-size: 16px;
          transition: transform 0.15s;
          flex-shrink: 0;
        }
      `}</style>

      <main className="pd-page">
        <AppNav />
        <div className="pd-shell">
          {/* Header */}
          <div className="pd-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="pd-header-eyebrow">Provider</p>
              <h1 className="pd-header-title">Dashboard</h1>
              {provider ? (
                <div className="pd-header-meta">
                  <span className="pd-business-name">
                    {provider.businessName}
                  </span>
                  <span
                    className="pd-status-pill"
                    style={{
                      background: sc.bg,
                      color: sc.color,
                      borderColor: sc.border,
                    }}
                  >
                    {provider.status}
                  </span>
                </div>
              ) : !error ? (
                <span className="pd-loading">Loading provider...</span>
              ) : null}
              {error && <p className="pd-error">{error}</p>}
            </div>
            {provider?.photo || provider?.avatarUrl ? (
              <img
                src={provider.photo || provider.avatarUrl}
                alt={provider.businessName}
                className="pd-header-photo"
              />
            ) : (
              <div className="pd-header-avatar">🏢</div>
            )}
          </div>

          {/* Stats */}
          <div className="pd-stats">
            <div className="pd-stat">
              <div className="pd-stat-num">{stats.services}</div>
              <div className="pd-stat-label">My Services</div>
            </div>
            <div className="pd-stat">
              <div className="pd-stat-num">{stats.bookings}</div>
              <div className="pd-stat-label">Total Bookings</div>
            </div>
            <div className="pd-stat">
              <div
                className={`pd-stat-num ${stats.pending > 0 ? "pending" : ""}`}
              >
                {stats.pending}
              </div>
              <div className="pd-stat-label">Pending Requests</div>
            </div>
          </div>

          {/* Nav links */}
          <div className="pd-nav">
            {navLinks.map(({ href, label, desc, icon }) => (
              <Link key={href} href={href} className="pd-nav-link">
                <div className="pd-nav-icon">{icon}</div>
                <div className="pd-nav-text">
                  <span className="pd-nav-label">{label}</span>
                  <span className="pd-nav-desc">{desc}</span>
                </div>
                <span className="pd-nav-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
