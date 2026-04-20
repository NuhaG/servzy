"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

function IconSearch()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>; }
function IconCal()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IconStar()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconDoc()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function IconDocPlus() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>; }
function IconUser()    { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IconArrow()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>; }

const NAV = [
  { href:"/services",        label:"Browse Services",  desc:"Find services near you",       Icon:IconSearch,  color:"#2563eb", bg:"#eff6ff" },
  { href:"/user/bookings",   label:"Manage Bookings",  desc:"Track your booking history",   Icon:IconCal,     color:"#b91c1c", bg:"#fff1f2" },
  { href:"/user/reviews",    label:"Manage Reviews",   desc:"See reviews you've left",      Icon:IconStar,    color:"#d97706", bg:"#fffbeb" },
  { href:"/user/complaints", label:"File Complaint",   desc:"Report a service issue",       Icon:IconDoc,     color:"#52525b", bg:"#f8fafc" },
  { href:"/user/contract",   label:"My Contracts",     desc:"View and renew contracts",     Icon:IconDocPlus, color:"#9f1239", bg:"#fde2e8", contract:true },
  { href:"/user/profile",    label:"Edit Profile",     desc:"Update your details",          Icon:IconUser,    color:"#7c3aed", bg:"#faf5ff" },
];

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser]                     = useState(null);
  const [stats, setStats]                   = useState({ total:0, completed:0, pending:0 });
  const [activeContracts, setActiveContracts] = useState(0);
  const [error, setError]                   = useState("");

  useEffect(() => {
    async function load() {
      try {
        const meRes  = await fetch("/api/me");
        const meData = await meRes.json();
        if (!meRes.ok) throw new Error(meData.error || "Failed to load account");
        if (meData.user?.role === "provider") { router.replace("/provider/dashboard"); return; }
        if (meData.user?.role === "admin")    { router.replace("/admin/dashboard");    return; }
        setUser(meData.user);

        const bRes  = await fetch(`/api/bookings?userId=${encodeURIComponent(meData.user._id)}`);
        const bData = await bRes.json();
        if (!bRes.ok) throw new Error(bData.error || "Failed to load bookings");

        setStats({
          total:     bData.length,
          completed: bData.filter((b) => b.status === "completed").length,
          pending:   bData.filter((b) => ["pending","accepted"].includes(b.status)).length,
        });
        const contracts = bData.filter((b) => b.type === "contract");
        setActiveContracts(contracts.filter((c) => c.status === "active").length);
      } catch (err) {
        setError(err.message);
      }
    }
    load();
  }, [router]);

  function getInitials(name) {
    if (!name) return "U";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  function greet() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .ud-page { min-height:100vh; background:linear-gradient(160deg,#fdf4f4 0%,#fef0ef 55%,#fdf4f4 100%); font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
        .ud-shell { max-width:860px; margin:0 auto; padding:32px 18px 64px; }

        .ud-header { background:#fff; border-radius:16px; padding:24px 28px; margin-bottom:20px; border:0.5px solid rgba(185,28,28,0.28); box-shadow:0 1px 4px rgba(185,28,28,0.06),0 8px 32px rgba(185,28,28,0.04); display:flex; align-items:center; justify-content:space-between; gap:20px; }
        .ud-role  { font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#b91c1c; margin-bottom:4px; }
        .ud-title { font-size:24px; font-weight:800; color:#18181b; letter-spacing:-0.03em; margin-bottom:5px; }
        .ud-name  { font-size:14px; font-weight:600; color:#27272a; margin-bottom:2px; }
        .ud-email { font-size:12px; color:#71717a; }
        .ud-avatar { width:58px; height:58px; border-radius:14px; background:linear-gradient(135deg,#7f1d1d,#b91c1c); color:#fff; font-size:18px; font-weight:800; display:flex; align-items:center; justify-content:center; flex-shrink:0; border:2px solid rgba(185,28,28,0.15); }
        .ud-loading { font-size:13px; color:#a1a1aa; font-style:italic; }
        .ud-error { margin-top:10px; font-size:13px; color:#b91c1c; background:#fff1f2; border:1px solid #fecaca; border-radius:8px; padding:9px 13px; }

        .ud-section { font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#a1a1aa; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
        .ud-section::after { content:''; flex:1; height:1px; background:rgba(185,28,28,0.1); }

        .ud-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
        @media (max-width:520px) { .ud-stats { grid-template-columns:1fr; } }
        .ud-stat { background:#fff; border-radius:14px; padding:20px 22px; border:0.5px solid rgba(185,28,28,0.24); box-shadow:0 1px 4px rgba(185,28,28,0.04),0 4px 16px rgba(185,28,28,0.03); position:relative; overflow:hidden; }
        .ud-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:3px 3px 0 0; }
        .ud-stat.s-t::before { background:linear-gradient(90deg,#b91c1c,#dc2626); }
        .ud-stat.s-d::before { background:linear-gradient(90deg,#16a34a,#22c55e); }
        .ud-stat.s-a::before { background:linear-gradient(90deg,#d97706,#f59e0b); }
        .ud-stat-n { font-size:36px; font-weight:800; color:#18181b; letter-spacing:-0.05em; line-height:1; margin-bottom:4px; }
        .ud-stat-n.g { color:#16a34a; }
        .ud-stat-n.a { color:#d97706; }
        .ud-stat-l { font-size:11px; font-weight:600; color:#52525b; letter-spacing:0.04em; text-transform:uppercase; }

        .ud-nav { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        @media (max-width:480px) { .ud-nav { grid-template-columns:1fr; } }
        .ud-nav-link:last-child:nth-child(odd) { grid-column:1/-1; }

        .ud-nc { background:#fff; border-radius:14px; border:0.5px solid rgba(185,28,28,0.26); box-shadow:0 1px 4px rgba(185,28,28,0.04),0 4px 16px rgba(185,28,28,0.03); text-decoration:none; display:block; overflow:hidden; transition:transform 0.18s,box-shadow 0.18s,border-color 0.18s; position:relative; }
        .ud-nc:hover { transform:translateY(-3px); box-shadow:0 8px 32px rgba(185,28,28,0.12); border-color:rgba(185,28,28,0.2); }
        .ud-nc:hover .ud-stripe { opacity:1; }
        .ud-nc:hover .ud-arr { transform:translateX(4px); opacity:1; }
        .ud-nc.ct { border:0.5px solid rgba(185,28,28,0.34); background:#fffafa; }
        .ud-nc.ct .ud-stripe { opacity:1; }
        .ud-nc.ct .ud-arr { opacity:1; color:#b91c1c; }
        .ud-nc.ct .ud-nc-label { color:#7f1d1d; }

        .ud-stripe { position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,#b91c1c,#dc2626); opacity:0; transition:opacity 0.18s; }
        .ud-nc-inner { padding:18px 20px; display:flex; align-items:center; gap:14px; }
        .ud-nc-icon { width:40px; height:40px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .ud-nc-text { flex:1; min-width:0; }
        .ud-nc-label { font-size:14px; font-weight:700; color:#111111; display:block; margin-bottom:2px; letter-spacing:-0.01em; }
        .ud-nc-desc  { font-size:11px; color:#52525b; display:block; font-weight:500; line-height:1.4; }
        .ud-arr { color:#d4d4d8; transition:transform 0.18s,opacity 0.18s; opacity:0.4; flex-shrink:0; }
        .ud-badge { position:absolute; top:-5px; right:12px; background:#b91c1c; color:#fff; font-size:9px; font-weight:700; padding:2px 7px; border-radius:20px; letter-spacing:0.04em; }
      `}</style>

      <main className="ud-page">
        <AppNav />
        <div className="ud-shell">

          <div className="ud-header">
            <div>
              <div className="ud-role">User Dashboard</div>
              <div className="ud-title">{user ? `${greet()}, ${user.name?.split(" ")[0]}` : "Dashboard"}</div>
              {user ? <><div className="ud-name">{user.name}</div><div className="ud-email">{user.email}</div></> : !error ? <div className="ud-loading">Loading account…</div> : null}
              {error && <div className="ud-error">{error}</div>}
            </div>
            <div className="ud-avatar">{getInitials(user?.name)}</div>
          </div>

          <div className="ud-section">Overview</div>
          <div className="ud-stats">
            <div className="ud-stat s-t"><div className="ud-stat-n">{stats.total}</div><div className="ud-stat-l">Total Bookings</div></div>
            <div className="ud-stat s-d"><div className={`ud-stat-n ${stats.completed > 0 ? "g" : ""}`}>{stats.completed}</div><div className="ud-stat-l">Completed</div></div>
            <div className="ud-stat s-a"><div className={`ud-stat-n ${stats.pending > 0 ? "a" : ""}`}>{stats.pending}</div><div className="ud-stat-l">Active</div></div>
          </div>

          <div className="ud-section">Quick Actions</div>
          <div className="ud-nav">
            {NAV.map(({ href, label, desc, Icon, color, bg, contract }) => (
              <Link key={href} href={href} className={`ud-nc ${contract ? "ct" : ""}`}>
                {contract && activeContracts > 0 && <span className="ud-badge">{activeContracts} ACTIVE</span>}
                <div className="ud-stripe" />
                <div className="ud-nc-inner">
                  <div className="ud-nc-icon" style={{ background: bg }}><span style={{ color }}><Icon /></span></div>
                  <div className="ud-nc-text">
                    <span className="ud-nc-label">{label}</span>
                    <span className="ud-nc-desc">{desc}</span>
                  </div>
                  <span className="ud-arr"><IconArrow /></span>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </main>
    </>
  );
}
