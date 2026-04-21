"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

function IconUser() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconTool() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
function IconCal() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
      <path d="M3 9h6" />
      <path d="M3 15h6" />
      <path d="M15 8h2" />
      <path d="M15 12h2" />
      <path d="M15 16h2" />
    </svg>
  );
}

const NAV = [
  {
    href: "/provider/profile",
    label: "Edit Profile",
    desc: "Business info & photo",
    Icon: IconUser,
    color: "#7c3aed",
    bg: "#faf5ff",
  },
  {
    href: "/provider/services",
    label: "My Services",
    desc: "Manage service listings",
    Icon: IconTool,
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    href: "/provider/services/new",
    label: "Create Service",
    desc: "Add a new listing",
    Icon: IconPlus,
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    href: "/provider/bookings",
    label: "Booking Requests",
    desc: "Review and respond",
    Icon: IconCal,
    color: "#b91c1c",
    bg: "#fff1f2",
  },
  {
    href: "/provider/complaints",
    label: "Complaints",
    desc: "View complaints against you",
    Icon: IconAlert,
    color: "#d97706",
    bg: "#fffbeb",
  },
];

function statusStyle(status) {
  if (status === "approved" || status === "active")
    return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
  if (status === "blocked")
    return { bg: "#fff1f2", color: "#b91c1c", border: "#fecaca" };
  if (status === "pending")
    return { bg: "#fefce8", color: "#854d0e", border: "#fde68a" };
  return { bg: "#fafafa", color: "#555", border: "#e5e5e5" };
}

export default function ProviderDashboardPage() {
  const router = useRouter();
  const [provider, setProvider] = useState(null);
  const [stats, setStats] = useState({ services: 0, bookings: 0, pending: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/me");
        const meData = await meRes.json();
        if (!meRes.ok)
          throw new Error(meData.error || "Failed to load account");
        if (meData.user?.role === "admin") {
          router.replace("/admin/dashboard");
          return;
        }
        if (meData.user?.role === "user") {
          router.replace("/user/dashboard");
          return;
        }
        if (meData.user?.role !== "provider") {
          router.replace("/");
          return;
        }

        if (!meData.provider?._id) {
          const cRes = await fetch("/api/providers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessName: meData.user?.name
                ? `${meData.user.name} Services`
                : "Provider Services",
            }),
          });
          if (!cRes.ok) {
            const cData = await cRes.json().catch(() => ({}));
            const msg = cData.error || "Provider profile not found";
            if (!String(msg).toLowerCase().includes("already exists"))
              throw new Error(msg);
          }
          const retryRes = await fetch("/api/me");
          const retryData = await retryRes.json();
          if (!retryRes.ok || !retryData.provider?._id)
            throw new Error("Provider profile not found for this account");
          meData.provider = retryData.provider;
        }

        const pRes = await fetch(`/api/providers/${meData.provider._id}`);
        const pData = await pRes.json();
        if (!pRes.ok) throw new Error(pData.error || "Failed to load provider");
        setProvider(pData);

        const bRes = await fetch(
          `/api/bookings?providerId=${encodeURIComponent(meData.provider._id)}`,
        );
        const bData = await bRes.json();
        if (!bRes.ok) throw new Error(bData.error || "Failed to load bookings");

        setStats({
          services: pData.services?.length || 0,
          bookings: bData.length,
          pending: bData.filter((b) => b.status === "pending").length,
        });
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [router]);

  const sc = statusStyle(provider?.status);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .pd-page { min-height:100vh; background:linear-gradient(160deg,#fdf4f4 0%,#fef0ef 55%,#fdf4f4 100%); font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
        .pd-shell { max-width:860px; margin:0 auto; padding:32px 18px 64px; }

        .pd-header { background:#fff; border-radius:16px; padding:24px 28px; margin-bottom:20px; border:0.5px solid rgba(185,28,28,0.28); box-shadow:0 1px 4px rgba(185,28,28,0.06),0 8px 32px rgba(185,28,28,0.04); display:flex; align-items:center; justify-content:space-between; gap:20px; }
        .pd-role   { font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#b91c1c; margin-bottom:4px; }
        .pd-title  { font-size:24px; font-weight:800; color:#18181b; letter-spacing:-0.03em; margin-bottom:5px; }
        .pd-sub    { font-size:13px; color:#71717a; font-weight:500; margin-bottom:6px; }
        .pd-pill   { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; padding:3px 10px; border-radius:20px; border:1px solid; text-transform:capitalize; }
        .pd-avatar { width:58px; height:58px; border-radius:14px; background:#fef2f2; border:2px solid rgba(185,28,28,0.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
        .pd-avatar img { width:100%; height:100%; object-fit:cover; }
        .pd-loading { font-size:13px; color:#a1a1aa; font-style:italic; }
        .pd-error { margin-top:10px; font-size:13px; color:#b91c1c; background:#fff1f2; border:1px solid #fecaca; border-radius:8px; padding:9px 13px; }

        /* Warning banners */
        .pd-warn { background:#fff; border:0.5px solid rgba(185,28,28,0.28); border-left:3px solid #b91c1c; border-radius:12px; padding:14px 18px; margin-bottom:14px; display:flex; align-items:flex-start; gap:12px; }
        .pd-warn-dot { width:8px; height:8px; border-radius:50%; background:#b91c1c; margin-top:4px; flex-shrink:0; }
        .pd-warn-title { font-size:13px; font-weight:700; color:#b91c1c; margin-bottom:2px; }
        .pd-warn-msg   { font-size:12px; color:#5b1111; line-height:1.5; }

        .pd-section { font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#a1a1aa; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
        .pd-section::after { content:''; flex:1; height:1px; background:rgba(185,28,28,0.1); }

        .pd-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
        @media (max-width:520px) { .pd-stats { grid-template-columns:1fr; } }
        .pd-stat { background:#fff; border-radius:14px; padding:20px 22px; border:0.5px solid rgba(185,28,28,0.24); box-shadow:0 1px 4px rgba(185,28,28,0.04),0 4px 16px rgba(185,28,28,0.03); position:relative; overflow:hidden; }
        .pd-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:3px 3px 0 0; }
        .pd-stat.s-t::before { background:linear-gradient(90deg,#b91c1c,#dc2626); }
        .pd-stat.s-b::before { background:linear-gradient(90deg,#16a34a,#22c55e); }
        .pd-stat.s-p::before { background:linear-gradient(90deg,#d97706,#f59e0b); }
        .pd-stat-n { font-size:36px; font-weight:800; color:#18181b; letter-spacing:-0.05em; line-height:1; margin-bottom:4px; }
        .pd-stat-n.amber { color:#d97706; }
        .pd-stat-l { font-size:11px; font-weight:600; color:#52525b; letter-spacing:0.04em; text-transform:uppercase; }

        .pd-nav { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        @media (max-width:480px) { .pd-nav { grid-template-columns:1fr; } }
        .pd-nav-link:last-child:nth-child(odd) { grid-column:1/-1; }

        .pd-nc { background:#fff; border-radius:14px; border:0.5px solid rgba(185,28,28,0.26); box-shadow:0 1px 4px rgba(185,28,28,0.04),0 4px 16px rgba(185,28,28,0.03); text-decoration:none; display:block; overflow:hidden; transition:transform 0.18s,box-shadow 0.18s,border-color 0.18s; position:relative; }
        .pd-nc:hover { transform:translateY(-3px); box-shadow:0 8px 32px rgba(185,28,28,0.12); border-color:rgba(185,28,28,0.2); }
        .pd-nc:hover .pd-stripe { opacity:1; }
        .pd-nc:hover .pd-arr { transform:translateX(4px); opacity:1; }

        .pd-stripe { position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#b91c1c,#dc2626); opacity:0; transition:opacity 0.18s; }
        .pd-nc-inner { padding:18px 20px; display:flex; align-items:center; gap:14px; }
        .pd-nc-icon { width:40px; height:40px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .pd-nc-text { flex:1; min-width:0; }
        .pd-nc-label { font-size:14px; font-weight:700; color:#111111; display:block; margin-bottom:2px; letter-spacing:-0.01em; }
        .pd-nc-desc  { font-size:11px; color:#52525b; display:block; font-weight:500; line-height:1.4; }
        .pd-arr { color:#d4d4d8; transition:transform 0.18s,opacity 0.18s; opacity:0.4; flex-shrink:0; }
      `}</style>

      <main className="pd-page">
        <AppNav />
        <div className="pd-shell">
          {/* Header */}
          <div className="pd-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="pd-role">Provider Dashboard</div>
              <div className="pd-title">
                {provider ? provider.businessName : "Dashboard"}
              </div>
              {provider ? (
                <>
                  <div className="pd-sub">
                    {provider.location || "Location not set"}
                  </div>
                  <span
                    className="pd-pill"
                    style={{
                      background: sc.bg,
                      color: sc.color,
                      borderColor: sc.border,
                    }}
                  >
                    {provider.status}
                  </span>
                </>
              ) : !error ? (
                <div className="pd-loading">Loading provider…</div>
              ) : null}
              {error && <div className="pd-error">{error}</div>}
            </div>
            <div className="pd-avatar">
              {provider?.photo || provider?.avatarUrl ? (
                <img
                  src={provider.photo || provider.avatarUrl}
                  alt={provider.businessName}
                />
              ) : (
                <span style={{ color: "#b91c1c" }}>
                  <IconBuilding />
                </span>
              )}
            </div>
          </div>

          {/* Warning banners */}
          {provider?.blocked && (
            <div className="pd-warn">
              <div className="pd-warn-dot" />
              <div>
                <div className="pd-warn-title">Account Blocked</div>
                <div className="pd-warn-msg">
                  Your account has been blocked. You cannot accept new bookings.
                  Please contact support.
                </div>
              </div>
            </div>
          )}
          {provider?.flaggedCount > 0 && (
            <div className="pd-warn">
              <div className="pd-warn-dot" />
              <div>
                <div className="pd-warn-title">Account Flagged</div>
                <div className="pd-warn-msg">
                  Your account has been flagged for review (
                  {provider.flaggedCount} time
                  {provider.flaggedCount > 1 ? "s" : ""}). Ensure your services
                  comply with our policies.
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="pd-section">Overview</div>
          <div className="pd-stats">
            <div className="pd-stat s-t">
              <div className="pd-stat-n">{stats.services}</div>
              <div className="pd-stat-l">My Services</div>
            </div>
            <div className="pd-stat s-b">
              <div className="pd-stat-n">{stats.bookings}</div>
              <div className="pd-stat-l">Total Bookings</div>
            </div>
            <div className="pd-stat s-p">
              <div className={`pd-stat-n ${stats.pending > 0 ? "amber" : ""}`}>
                {stats.pending}
              </div>
              <div className="pd-stat-l">Pending</div>
            </div>
          </div>

          {/* Nav cards */}
          <div className="pd-section">Quick Actions</div>
          <div className="pd-nav">
            {NAV.map(({ href, label, desc, Icon, color, bg }) => (
              <Link key={href} href={href} className="pd-nc">
                <div className="pd-stripe" />
                <div className="pd-nc-inner">
                  <div className="pd-nc-icon" style={{ background: bg }}>
                    <span style={{ color }}>
                      <Icon />
                    </span>
                  </div>
                  <div className="pd-nc-text">
                    <span className="pd-nc-label">{label}</span>
                    <span className="pd-nc-desc">{desc}</span>
                  </div>
                  <span className="pd-arr">
                    <IconArrow />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
