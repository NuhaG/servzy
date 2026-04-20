"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
  const [activeContracts, setActiveContracts] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();
        if (!meResponse.ok) throw new Error(meData.error || "Failed to load account");
        if (meData.user?.role === "provider") { router.replace("/provider/dashboard"); return; }
        if (meData.user?.role === "admin") { router.replace("/admin/dashboard"); return; }
        setUser(meData.user);

        const bookingsResponse = await fetch(`/api/bookings?userId=${encodeURIComponent(meData.user._id)}`);
        const bookingsData = await bookingsResponse.json();
        if (!bookingsResponse.ok) throw new Error(bookingsData.error || "Failed to load bookings");

        setStats({
          total: bookingsData.length,
          completed: bookingsData.filter((b) => b.status === "completed").length,
          pending: bookingsData.filter((b) => ["pending", "accepted"].includes(b.status)).length,
        });

        try {
          const contractRes = await fetch(`/api/bookings?userId=${encodeURIComponent(meData.user._id)}`);
          if (contractRes.ok) {
            const contractData = await contractRes.json();
            const contractBookings = Array.isArray(contractData) ? contractData.filter((item) => item.type === "contract") : [];
            setActiveContracts(contractBookings.filter((c) => c.status === "active").length);
          }
        } catch (_) {}
      } catch (err) {
        setError(err.message);
      }
    }
    loadDashboard();
  }, [router]);

  function getInitials(name) {
    if (!name) return "U";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  const navLinks = [
    { href: "/services",        label: "Browse Services",  desc: "Explore available services near you",    icon: "🔍" },
    { href: "/user/bookings",   label: "Manage Bookings",  desc: "View and track your booking history",    icon: "📅" },
    { href: "/user/reviews",    label: "Manage Reviews",   desc: "See and edit reviews you've left",       icon: "⭐" },
    { href: "/user/complaints", label: "File Complaint",   desc: "Report an issue with a service",         icon: "📋" },
    {
      href: "/user/contracts",
      label: "My Contracts",
      desc: "View, manage and renew service contracts",
      icon: "📄",
      highlight: activeContracts > 0,
      badge: activeContracts > 0 ? `${activeContracts} active` : null,
    },
    { href: "/user/profile",    label: "Edit Profile",     desc: "Update your details and location",        icon: "✏️" },
  ];

  return (
    <>
      <style>{`
        .ud-page { min-height: 100vh; background: #fef2f2; }
        .ud-shell { max-width: 860px; margin: 0 auto; padding: 36px 20px 64px; }
        .ud-header { background: #fff; border: 1px solid #fecaca; border-left: 4px solid #b91c1c; border-radius: 12px; padding: 24px 28px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .ud-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #b91c1c; margin-bottom: 5px; }
        .ud-title { font-size: 22px; font-weight: 700; color: #111; letter-spacing: -0.02em; margin: 0 0 5px; }
        .ud-name { font-size: 13px; font-weight: 600; color: #333; }
        .ud-email { font-size: 12px; color: #888; margin-top: 1px; }
        .ud-loading { font-size: 13px; color: #aaa; font-style: italic; }
        .ud-error { margin-top: 10px; font-size: 13px; color: #b91c1c; background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 9px 13px; }
        .ud-avatar { width: 60px; height: 60px; border-radius: 50%; background: #7f1d1d; color: #fff; font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; letter-spacing: 0.02em; border: 2px solid #fecaca; }
        .ud-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 14px; }
        @media (max-width: 520px) { .ud-stats { grid-template-columns: 1fr; } }
        .ud-stat { background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 22px 24px 18px; position: relative; overflow: hidden; }
        .ud-stat::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #b91c1c; opacity: 0.2; }
        .ud-stat-num { font-size: 38px; font-weight: 800; color: #111; letter-spacing: -0.04em; line-height: 1; margin-bottom: 5px; }
        .ud-stat-num.active { color: #b91c1c; }
        .ud-stat-num.completed { color: #15803d; }
        .ud-stat-label { font-size: 12px; color: #888; font-weight: 500; }
        .ud-nav { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (max-width: 480px) { .ud-nav { grid-template-columns: 1fr; } }
        .ud-nav-link:last-child:nth-child(odd) { grid-column: 1 / -1; }
        .ud-nav-link { display: flex; align-items: center; gap: 14px; background: #7f1d1d; border: 1px solid #991b1b; border-radius: 12px; padding: 20px 22px; text-decoration: none; color: #fff; transition: background 0.15s, transform 0.15s, box-shadow 0.15s; position: relative; }
        .ud-nav-link:hover { background: #991b1b; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(127,29,29,0.25); }
        .ud-nav-link:hover .ud-arrow { transform: translateX(4px); }
        .ud-nav-link.highlight { background: #fff; border: 2px solid #b91c1c; box-shadow: 0 0 0 3px rgba(185,28,28,0.08); }
        .ud-nav-link.highlight .ud-nav-label { color: #7f1d1d; }
        .ud-nav-link.highlight .ud-nav-desc { color: #b91c1c; opacity: 0.7; }
        .ud-nav-link.highlight .ud-arrow { color: #b91c1c; }
        .ud-nav-link.highlight .ud-nav-icon { background: #fef2f2; border: 1px solid #fecaca; }
        .ud-nav-link.highlight:hover { background: #fef2f2; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(185,28,28,0.15); }
        .ud-nav-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .ud-nav-text { flex: 1; min-width: 0; }
        .ud-nav-label { font-size: 14px; font-weight: 600; color: #fff; display: block; margin-bottom: 2px; }
        .ud-nav-desc { font-size: 12px; color: #fca5a5; display: block; }
        .ud-arrow { color: #fca5a5; font-size: 15px; transition: transform 0.15s; flex-shrink: 0; }
        .ud-badge { position: absolute; top: -7px; right: 12px; background: #b91c1c; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; border: 2px solid #fef2f2; white-space: nowrap; }
      `}</style>

      <main className="ud-page">
        <AppNav />
        <div className="ud-shell">
          <div className="ud-header">
            <div style={{ flex:1, minWidth:0 }}>
              <p className="ud-eyebrow">User</p>
              <h1 className="ud-title">Dashboard</h1>
              {user ? (<><p className="ud-name">{user.name}</p><p className="ud-email">{user.email}</p></>) : !error ? (<span className="ud-loading">Loading account...</span>) : null}
              {error && <p className="ud-error">{error}</p>}
            </div>
            <div className="ud-avatar">{getInitials(user?.name)}</div>
          </div>

          <div className="ud-stats">
            <div className="ud-stat"><div className="ud-stat-num">{stats.total}</div><div className="ud-stat-label">Total Bookings</div></div>
            <div className="ud-stat"><div className={`ud-stat-num ${stats.completed > 0 ? "completed" : ""}`}>{stats.completed}</div><div className="ud-stat-label">Completed</div></div>
            <div className="ud-stat"><div className={`ud-stat-num ${stats.pending > 0 ? "active" : ""}`}>{stats.pending}</div><div className="ud-stat-label">Active</div></div>
          </div>

          <div className="ud-nav">
            {navLinks.map(({ href, label, desc, icon, highlight, badge }) => (
              <Link key={href} href={href} className={`ud-nav-link ${highlight ? "highlight" : ""}`}>
                {badge && <span className="ud-badge">{badge}</span>}
                <div className="ud-nav-icon">{icon}</div>
                <div className="ud-nav-text">
                  <span className="ud-nav-label">{label}</span>
                  <span className="ud-nav-desc">{desc}</span>
                </div>
                <span className="ud-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
