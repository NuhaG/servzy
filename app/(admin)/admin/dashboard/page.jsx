"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [providers, setProviders] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [providersResponse, usersResponse] = await Promise.all([
          fetch("/api/providers?includeAll=1"),
          fetch("/api/users?page=1&limit=1"),
        ]);

        const providersData = await providersResponse.json();
        const usersData = await usersResponse.json();

        if (!providersResponse.ok)
          throw new Error(providersData.error || "Failed to fetch providers");
        if (!usersResponse.ok)
          throw new Error(usersData.error || "Failed to fetch users");

        if (!isMounted) return;
        setProviders(Array.isArray(providersData) ? providersData : []);
        setUsersTotal(Number(usersData.totalUsers || 0));
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.message || "Something went wrong while loading dashboard.",
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalProviders = providers.length;
    const blockedProviders = providers.filter(
      (p) => p.status === "blocked" || p.blocked,
    ).length;
    const flaggedProviders = providers.filter(
      (p) => Number(p.flaggedCount || 0) > 0,
    ).length;
    const lowReliability = providers.filter(
      (p) => Number(p.reliabilityScore || 0) < 80,
    ).length;
    const avgReliability = totalProviders
      ? Math.round(
          providers.reduce(
            (sum, p) => sum + Number(p.reliabilityScore || 0),
            0,
          ) / totalProviders,
        )
      : 0;
    return {
      totalProviders,
      blockedProviders,
      flaggedProviders,
      lowReliability,
      avgReliability,
    };
  }, [providers]);

  const hasAttentionItems =
    stats.flaggedProviders > 0 ||
    stats.blockedProviders > 0 ||
    stats.lowReliability > 0;

  const quickActions = [
    {
      title: "Manage Providers",
      subtitle: "Review profile quality and status",
      emoji: "🧰",
      onClick: () => router.push("/admin/providers"),
      tone: "blue",
    },
    {
      title: "Manage Users",
      subtitle: "Flag or block suspicious users",
      emoji: "👥",
      onClick: () => router.push("/admin/users"),
      tone: "green",
    },
    {
      title: "Review Complaints",
      subtitle: "Triage and resolve user complaints",
      emoji: "⚠️",
      onClick: () => router.push("/admin/complaints"),
      tone: "orange",
    },
    {
      title: "Review Flagged",
      subtitle: `Open ${stats.flaggedProviders} flagged provider${stats.flaggedProviders === 1 ? "" : "s"}`,
      emoji: "🚩",
      onClick: () => router.push("/admin/providers"),
      tone: "orange",
    },
  ];

  return (
    <>
      <style>{`
        :root {
          --ad-bg: #fdf2f3;
          --ad-card: #fff;
          --ad-border: #f2c7cc;
          --ad-muted: #6b7280;
          --ad-title: #111827;
          --ad-accent: #b91c1c;
          --ad-accent-soft: #fee2e2;
          --ad-shadow: 0 10px 30px rgba(127, 29, 29, 0.06);
        }

        .ad-page { min-height: 100vh; background: radial-gradient(circle at top, #fff6f7, var(--ad-bg) 48%); }
        .ad-shell { max-width: 960px; margin: 0 auto; padding: 32px 20px 64px; }

        .ad-hero {
          background: var(--ad-card);
          border: 1px solid var(--ad-border);
          border-left: 4px solid var(--ad-accent);
          border-radius: 14px;
          padding: 24px 26px;
          box-shadow: var(--ad-shadow);
        }
        .ad-hero-kicker {
          color: var(--ad-accent);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 11px;
          font-weight: 700;
          margin: 0 0 8px;
        }
        .ad-hero h1 { margin: 0; font-size: 31px; line-height: 1.1; color: var(--ad-title); }
        .ad-hero p { margin: 8px 0 0; font-size: 14px; color: var(--ad-muted); }
        .ad-hero-chip {
          display: inline-block;
          margin-top: 14px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          color: #7f1d1d;
          background: #fff1f2;
          border: 1px solid #fecdd3;
        }

        .ad-alert {
          margin-top: 14px;
          background: #fff;
          border: 1px solid #fecaca;
          border-left: 3px solid #dc2626;
          border-radius: 12px;
          padding: 14px 16px;
          color: #7f1d1d;
          font-size: 14px;
          font-weight: 500;
        }

        .ad-section {
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #9ca3af;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 700;
        }
        .ad-section::after {
          content: "";
          height: 1px;
          background: #f2c7cc;
          flex: 1;
        }

        .ad-grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }
        .ad-card {
          background: #fff;
          border: 1px solid #f3d3d7;
          border-radius: 12px;
          padding: 16px;
          position: relative;
          overflow: hidden;
        }
        .ad-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #fca5a5;
        }
        .ad-card-num { font-size: 30px; font-weight: 800; color: #111827; line-height: 1; margin-bottom: 4px; }
        .ad-card-label { font-size: 12px; color: var(--ad-muted); }

        .ad-actions {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .ad-action {
          border: 1px solid #f3d3d7;
          border-radius: 14px;
          background: #fff;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
          text-align: left;
        }
        .ad-action:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(127, 29, 29, 0.08);
          border-color: #f5b0b8;
        }
        .ad-action-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          font-size: 21px;
          flex-shrink: 0;
        }
        .ad-action.blue .ad-action-icon { background: #e0ecff; }
        .ad-action.green .ad-action-icon { background: #dcfce7; }
        .ad-action.orange .ad-action-icon { background: #ffedd5; }
        .ad-action-title { margin: 0; font-size: 17px; color: #111827; font-weight: 700; }
        .ad-action-sub { margin: 2px 0 0; font-size: 13px; color: var(--ad-muted); }

        .ad-error {
          margin-top: 12px;
          font-size: 13px;
          color: #b91c1c;
          background: #fff1f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 10px 12px;
        }

        @media (max-width: 900px) {
          .ad-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .ad-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 700px) {
          .ad-actions { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .ad-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ad-hero h1 { font-size: 26px; }
        }
      `}</style>

      <main className="ad-page">
        <AppNav />
        <div className="ad-shell">
          <section className="ad-hero">
            <p className="ad-hero-kicker">Admin Dashboard</p>
            <h1>Welcome back, Team Admin 👋</h1>
            <p>
              Here is a quick health check of your platform and the things that
              may need attention today.
            </p>
            <span className="ad-hero-chip">
              Updated live from users + providers
            </span>
          </section>

          {error && <p className="ad-error">{error}</p>}

          {!error && hasAttentionItems && (
            <div className="ad-alert">
              ⚠️ Heads up: you have flagged, blocked, or low-reliability
              providers to review.
            </div>
          )}

          <div className="ad-section">Overview</div>
          <section className="ad-grid">
            <article className="ad-card">
              <div className="ad-card-num">
                {loading ? "..." : stats.totalProviders}
              </div>
              <div className="ad-card-label">🧑‍🔧 Total Providers</div>
            </article>
            <article className="ad-card">
              <div className="ad-card-num">{loading ? "..." : usersTotal}</div>
              <div className="ad-card-label">👥 Total Users</div>
            </article>
            <article className="ad-card">
              <div className="ad-card-num">
                {loading ? "..." : stats.blockedProviders}
              </div>
              <div className="ad-card-label">🚫 Blocked Providers</div>
            </article>
            <article className="ad-card">
              <div className="ad-card-num">
                {loading ? "..." : stats.flaggedProviders}
              </div>
              <div className="ad-card-label">🚩 Flagged Providers</div>
            </article>
            <article className="ad-card">
              <div className="ad-card-num">
                {loading ? "..." : `${stats.avgReliability}%`}
              </div>
              <div className="ad-card-label">💚 Avg Reliability</div>
            </article>
          </section>

          <div className="ad-section">Quick Actions</div>
          <section className="ad-actions">
            {quickActions.map((action) => (
              <button
                key={action.title}
                className={`ad-action ${action.tone}`}
                onClick={action.onClick}
              >
                <span className="ad-action-icon">{action.emoji}</span>
                <span>
                  <p className="ad-action-title">{action.title}</p>
                  <p className="ad-action-sub">{action.subtitle}</p>
                </span>
              </button>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
