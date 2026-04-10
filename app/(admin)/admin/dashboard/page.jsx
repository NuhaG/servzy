"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ users: 0, providers: 0, bookings: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();
        if (!meResponse.ok)
          throw new Error(meData.error || "Failed to load account");
        if (meData.user?.role === "provider") {
          router.replace("/provider/dashboard");
          return;
        }
        if (meData.user?.role === "user") {
          router.replace("/user/dashboard");
          return;
        }

        const [usersResponse, providersResponse, bookingsResponse] =
          await Promise.all([
            fetch("/api/users?page=1&limit=1"),
            fetch("/api/providers?includeAll=1"),
            fetch("/api/bookings"),
          ]);

        const usersData = await usersResponse.json();
        const providersData = await providersResponse.json();
        const bookingsData = await bookingsResponse.json();

        if (!usersResponse.ok)
          throw new Error(usersData.error || "Failed to load users");
        if (!providersResponse.ok)
          throw new Error(providersData.error || "Failed to load providers");
        if (!bookingsResponse.ok)
          throw new Error(bookingsData.error || "Failed to load bookings");

        setStats({
          users: usersData.totalUsers || 0,
          providers: providersData.length || 0,
          bookings: bookingsData.length || 0,
        });
      } catch (err) {
        setError(err.message);
      }
    }

    loadDashboard();
  }, [router]);

  return (
    <>
      <style>{`
        .adm-page {
          min-height: 100vh;
          background: #fef2f2;
        }
        .adm-shell {
          max-width: 860px;
          margin: 0 auto;
          padding: 36px 20px 64px;
        }

        /* ── Header card ── */
        .adm-header-card {
          background: #fff;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 28px 32px;
          margin-bottom: 16px;
          border-left: 4px solid #b91c1c;
        }
        .adm-header-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #b91c1c;
          margin-bottom: 6px;
        }
        .adm-header-title {
          font-size: 26px;
          font-weight: 700;
          color: #111;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }
        .adm-header-sub {
          font-size: 14px;
          color: #888;
          margin: 0;
        }
        .adm-error {
          margin-top: 12px;
          font-size: 13px;
          color: #b91c1c;
          background: #fff1f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 14px;
        }

        /* ── Stat cards ── */
        .adm-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        @media (max-width: 560px) {
          .adm-stats { grid-template-columns: 1fr; }
        }
        .adm-stat {
          background: #fff;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 24px 28px 20px;
          position: relative;
          overflow: hidden;
        }
        .adm-stat::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: #b91c1c;
          opacity: 0.25;
        }
        .adm-stat-number {
          font-size: 40px;
          font-weight: 800;
          color: #111;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 6px;
        }
        .adm-stat-label {
          font-size: 13px;
          color: #888;
          font-weight: 500;
        }

        /* ── Nav cards ── */
        .adm-nav {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (max-width: 480px) {
          .adm-nav { grid-template-columns: 1fr; }
        }
        .adm-nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #7f1d1d;
          border: 1px solid #991b1b;
          border-radius: 12px;
          padding: 28px 26px;
          text-decoration: none;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
        }
        .adm-nav-link:hover {
          background: #991b1b;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(127, 29, 29, 0.25);
        }
        .adm-nav-link:hover .adm-nav-arrow {
          transform: translateX(4px);
        }
        .adm-nav-arrow {
          color: #fca5a5;
          transition: transform 0.15s;
          font-size: 18px;
          line-height: 1;
        }
      `}</style>

      <main className="adm-page">
        <AppNav />
        <div className="adm-shell">

          {/* Header */}
          <div className="adm-header-card">
            <p className="adm-header-label">Admin</p>
            <h1 className="adm-header-title">Dashboard</h1>
            <p className="adm-header-sub">
              Platform-wide visibility from live database records.
            </p>
            {error && <p className="adm-error">{error}</p>}
          </div>

          {/* Stats */}
          <div className="adm-stats">
            <div className="adm-stat">
              <div className="adm-stat-number">{stats.users}</div>
              <div className="adm-stat-label">Total Users</div>
            </div>
            <div className="adm-stat">
              <div className="adm-stat-number">{stats.providers}</div>
              <div className="adm-stat-label">Total Providers</div>
            </div>
            <div className="adm-stat">
              <div className="adm-stat-number">{stats.bookings}</div>
              <div className="adm-stat-label">Total Bookings</div>
            </div>
          </div>

          {/* Nav links */}
          <div className="adm-nav">
            <Link href="/admin/users" className="adm-nav-link">
              Users <span className="adm-nav-arrow">→</span>
            </Link>
            <Link href="/admin/providers" className="adm-nav-link">
              Providers <span className="adm-nav-arrow">→</span>
            </Link>
            <Link href="/admin/bookings" className="adm-nav-link">
              Bookings <span className="adm-nav-arrow">→</span>
            </Link>
            <Link href="/admin/complaints" className="adm-nav-link">
              Complaints <span className="adm-nav-arrow">→</span>
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
