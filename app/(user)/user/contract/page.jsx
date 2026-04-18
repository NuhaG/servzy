"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";

// ─── helpers ──────────────────────────────────────────────────────────────────
function daysLeft(endDate) {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function statusStyle(status) {
  if (status === "active")    return { bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0" };
  if (status === "completed") return { bg:"#fef2f2", color:"#888",    border:"#e5e5e5" };
  if (status === "expired")   return { bg:"#fff1f2", color:"#b91c1c", border:"#fecaca" };
  return { bg:"#fafafa", color:"#555", border:"#e5e5e5" };
}

// ─── Renew Modal ──────────────────────────────────────────────────────────────
function RenewModal({ contract, onClose, onSuccess }) {
  const [mode, setMode] = useState("same");   // "same" | "different"
  const [months, setMonths] = useState(3);
  const [days, setDays] = useState(contract?.contractDaysPerWeek || 3);
  const [startDate, setStartDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const DAYS_ALL = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const [selectedDays, setSelectedDays] = useState(contract?.preferredDays || ["Mon","Wed","Fri"]);

  function toggleDay(d) {
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  const totalVisits = months * 4 * days;
  const pricePerVisit = Number(contract?.serviceId?.price || contract?.pricePerVisit || 0);
  const estimatedTotal = pricePerVisit * totalVisits;

  async function submit() {
    if (!startDate) { setToast("Please select a start date."); return; }
    setSubmitting(true);
    try {
      const body = {
        originalContractId: contract._id,
        serviceId: contract.serviceId?._id || contract.serviceId,
        providerId: mode === "same" ? (contract.providerId?._id || contract.providerId) : undefined,
        contractMonths: months,
        contractDaysPerWeek: days,
        preferredDays: selectedDays,
        scheduledDate: startDate,
        type: "contract",
        amount: estimatedTotal,
        renewMode: mode,
      };
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to renew contract");
      onSuccess(mode);
    } catch (err) {
      setToast(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff", borderRadius:16, border:"1px solid #fecaca", width:"100%", maxWidth:480, boxShadow:"0 20px 60px rgba(185,28,28,0.15)", overflow:"hidden", animation:"modalUp 0.2s ease" }}>
        <style>{`@keyframes modalUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}`}</style>

        {/* Header */}
        <div style={{ padding:"18px 22px", borderBottom:"1px solid #fef2f2", borderLeft:"4px solid #b91c1c" }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#111" }}>Renew Contract</div>
          <div style={{ fontSize:12, color:"#888", marginTop:2 }}>
            {contract?.serviceId?.title || "Service"} · {contract?.providerId?.businessName || "Provider"}
          </div>
        </div>

        <div style={{ padding:"18px 22px", maxHeight:"65vh", overflowY:"auto" }}>

          {/* Mode toggle */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#b91c1c", marginBottom:8 }}>Renew With</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", border:"1px solid #fecaca", borderRadius:10, overflow:"hidden" }}>
              {[["same","Same Provider"],["different","Different Provider"]].map(([val, lbl]) => (
                <button key={val} onClick={() => setMode(val)}
                  style={{ padding:"10px 8px", fontSize:13, fontWeight:600, border:"none", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
                    background: mode === val ? "#7f1d1d" : "#fff",
                    color: mode === val ? "#fff" : "#888",
                    borderRight: val === "same" ? "1px solid #fecaca" : "none" }}>
                  {lbl}
                </button>
              ))}
            </div>
            {mode === "different" && (
              <div style={{ marginTop:10, padding:"10px 13px", background:"#fef2f2", border:"1px solid #fecaca", borderRadius:9, fontSize:12, color:"#b91c1c" }}>
                You will be redirected to browse providers for <strong>{contract?.serviceId?.title || "this service"}</strong> after submitting.
              </div>
            )}
          </div>

          {/* Duration */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#b91c1c", marginBottom:8 }}>Contract Duration</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:4 }}>Months</label>
                <input type="number" min={1} max={24} value={months}
                  onChange={(e) => setMonths(Math.max(1, +e.target.value))}
                  style={{ width:"100%", padding:"9px 12px", border:"1px solid #fecaca", borderRadius:9, fontSize:13, color:"#111", background:"#fef2f2", outline:"none", fontFamily:"inherit" }} />
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:4 }}>Days / week</label>
                <select value={days} onChange={(e) => setDays(+e.target.value)}
                  style={{ width:"100%", padding:"9px 12px", border:"1px solid #fecaca", borderRadius:9, fontSize:13, color:"#111", background:"#fef2f2", outline:"none", cursor:"pointer", fontFamily:"inherit", appearance:"none" }}>
                  {[1,2,3,4,5,6,7].map((n) => <option key={n} value={n}>{n} day{n>1?"s":""}/week</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Preferred days */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:6 }}>Preferred Days</label>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {DAYS_ALL.map((d) => (
                <span key={d} onClick={() => toggleDay(d)}
                  style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:"1px solid", transition:"all 0.15s",
                    background: selectedDays.includes(d) ? "#7f1d1d" : "#fff",
                    color: selectedDays.includes(d) ? "#fff" : "#888",
                    borderColor: selectedDays.includes(d) ? "#7f1d1d" : "#fecaca" }}>
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Start date */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, fontWeight:600, color:"#555", display:"block", marginBottom:4 }}>New Start Date</label>
            <input type="date" value={startDate} min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width:"100%", padding:"9px 12px", border:"1px solid #fecaca", borderRadius:9, fontSize:13, color:"#111", background:"#fef2f2", outline:"none", fontFamily:"inherit" }} />
          </div>

          {/* Summary */}
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#b91c1c", letterSpacing:"0.07em", textTransform:"uppercase", marginBottom:8 }}>Renewal Summary</div>
            {[
              ["Total visits", `${totalVisits} visits`],
              ["Price per visit", `₹${pricePerVisit.toLocaleString("en-IN")}`],
              ["Estimated total", `₹${estimatedTotal.toLocaleString("en-IN")}`],
              ["Provider", mode === "same" ? (contract?.providerId?.businessName || "Same provider") : "Choose after submit"],
            ].map(([k, v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"3px 0" }}>
                <span style={{ color:"#888" }}>{k}</span>
                <span style={{ fontWeight:600, color:"#111" }}>{v}</span>
              </div>
            ))}
          </div>

          {toast && (
            <div style={{ marginTop:10, fontSize:12, color:"#b91c1c", background:"#fff1f2", border:"1px solid #fecaca", borderRadius:8, padding:"8px 12px" }}>
              {toast}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 22px", borderTop:"1px solid #fef2f2", display:"flex", gap:8 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:10, borderRadius:10, border:"1px solid #e5e5e5", background:"#fff", color:"#555", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={submitting}
            style={{ flex:2, padding:10, borderRadius:10, border:"none", background:"#7f1d1d", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Processing…" : mode === "same" ? "Confirm Renewal →" : "Browse Providers →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Contract card ────────────────────────────────────────────────────────────
function ContractCard({ contract, onRenew }) {
  const left = daysLeft(contract.endDate);
  const sc = statusStyle(contract.status);
  const isExpiring = contract.status === "active" && left !== null && left <= 7;
  const canRenew = ["active","completed","expired"].includes(contract.status);

  return (
    <div style={{ background:"#fff", border:`1px solid ${isExpiring ? "#f97316" : "#fecaca"}`, borderRadius:14,
      padding:"18px 20px", marginBottom:10, boxShadow: isExpiring ? "0 0 0 3px rgba(249,115,22,0.1)" : "0 2px 10px rgba(185,28,28,0.04)",
      transition:"box-shadow 0.15s" }}>

      {/* Expiring banner */}
      {isExpiring && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:8, marginBottom:12, fontSize:12, color:"#c2410c", fontWeight:600 }}>
          <span>⚠️</span>
          Contract expires in {left} day{left !== 1 ? "s" : ""} — Consider renewing now.
        </div>
      )}

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#111", marginBottom:3 }}>
            {contract.serviceId?.title || "Service"}
          </div>
          <div style={{ fontSize:13, color:"#888", marginBottom:5 }}>
            {contract.providerId?.businessName || "Provider"}
            {contract.providerId?.location && (
              <span style={{ color:"#bbb" }}> · 📍{contract.providerId.location}</span>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, fontWeight:600, padding:"2px 10px", borderRadius:20, border:`1px solid ${sc.border}`, background:sc.bg, color:sc.color, textTransform:"capitalize" }}>
              {contract.status}
            </span>
            {contract.contractDaysPerWeek && (
              <span style={{ fontSize:11, color:"#888", background:"#fafafa", border:"1px solid #e5e5e5", padding:"2px 9px", borderRadius:20, fontWeight:500 }}>
                {contract.contractDaysPerWeek}×/week
              </span>
            )}
            {contract.preferredDays?.length > 0 && (
              <span style={{ fontSize:11, color:"#888" }}>{contract.preferredDays.join(", ")}</span>
            )}
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#b91c1c", letterSpacing:"-0.03em" }}>
            ₹{Number(contract.finalAmount || 0).toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize:11, color:"#aaa", marginTop:1 }}>total paid</div>
        </div>
      </div>

      {/* Date row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
        {[
          ["Start Date", formatDate(contract.startDate)],
          ["End Date",   formatDate(contract.endDate)],
          ["Duration",   contract.contractMonths ? `${contract.contractMonths} month${contract.contractMonths>1?"s":""}` : "—"],
        ].map(([k,v]) => (
          <div key={k} style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"8px 10px" }}>
            <div style={{ fontSize:10, color:"#888", fontWeight:500, marginBottom:2 }}>{k}</div>
            <div style={{ fontSize:13, fontWeight:600, color:"#111" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {canRenew && (
          <button onClick={() => onRenew(contract)}
            style={{ padding:"8px 18px", borderRadius:9, border:"none", background:"#7f1d1d", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", transition:"background 0.15s", fontFamily:"inherit" }}
            onMouseEnter={(e) => e.currentTarget.style.background="#991b1b"}
            onMouseLeave={(e) => e.currentTarget.style.background="#7f1d1d"}>
            🔄 Renew Contract
          </button>
        )}
        {contract.providerId?._id && (
          <Link href={`/providers/${contract.providerId._id}`}
            style={{ padding:"8px 14px", borderRadius:9, border:"1px solid #fecaca", background:"#fff", color:"#b91c1c", fontSize:13, fontWeight:600, textDecoration:"none", display:"inline-block", transition:"background 0.15s" }}>
            View Provider
          </Link>
        )}
        {contract.serviceId?._id && (
          <Link href={`/services?search=${encodeURIComponent(contract.serviceId?.title || "")}`}
            style={{ padding:"8px 14px", borderRadius:9, border:"1px solid #e5e5e5", background:"#fff", color:"#555", fontSize:13, fontWeight:600, textDecoration:"none", display:"inline-block" }}>
            Similar Services
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UserContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("active"); // active | completed | all
  const [renewingContract, setRenewingContract] = useState(null);
  const [toast, setToast] = useState({ show:false, msg:"", type:"success" });

  function showToast(msg, type = "success") {
    setToast({ show:true, msg, type });
    setTimeout(() => setToast((t) => ({ ...t, show:false })), 4000);
  }

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/me");
        const meData = await meRes.json();
        if (!meRes.ok) throw new Error(meData.error || "Failed to load account");

        const res = await fetch(`/api/bookings?userId=${encodeURIComponent(meData.user._id)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load bookings");
        setContracts(Array.isArray(data) ? data.filter((item) => item.type === "contract") : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (tab === "active")    return contracts.filter((c) => c.status === "active");
    if (tab === "completed") return contracts.filter((c) => ["completed","expired"].includes(c.status));
    return contracts;
  }, [contracts, tab]);

  const stats = useMemo(() => ({
    active:    contracts.filter((c) => c.status === "active").length,
    completed: contracts.filter((c) => ["completed","expired"].includes(c.status)).length,
    expiring:  contracts.filter((c) => c.status === "active" && daysLeft(c.endDate) !== null && daysLeft(c.endDate) <= 7).length,
  }), [contracts]);

  function handleRenewSuccess(mode) {
    setRenewingContract(null);
    if (mode === "different") {
      showToast("Redirecting you to browse providers…");
      setTimeout(() => { window.location.href = `/services?type=contract`; }, 1500);
    } else {
      showToast("✅ Contract renewed successfully! Check your bookings.");
    }
  }

  return (
    <>
      <style>{`
        .uc-page { min-height: 100vh; background: #fef2f2; }
        .uc-shell { max-width: 860px; margin: 0 auto; padding: 36px 20px 64px; }
        .uc-header { background: #fff; border: 1px solid #fecaca; border-left: 4px solid #b91c1c; border-radius: 12px; padding: 22px 26px; margin-bottom: 14px; }
        .uc-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #b91c1c; margin-bottom: 4px; }
        .uc-title { font-size: 22px; font-weight: 700; color: #111; letter-spacing: -0.02em; margin: 0 0 3px; }
        .uc-sub { font-size: 13px; color: #888; }
        .uc-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 14px; }
        @media(max-width:520px){.uc-stats{grid-template-columns:1fr;}}
        .uc-stat { background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 18px 20px; position: relative; overflow: hidden; }
        .uc-stat::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; background:#b91c1c; opacity:0.2; }
        .uc-stat-n { font-size: 30px; font-weight: 800; color: #111; letter-spacing: -0.04em; line-height: 1; margin-bottom: 4px; }
        .uc-stat-l { font-size: 11px; color: #888; }
        .uc-tabs { background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 16px; margin-bottom: 14px; display: flex; gap: 8px; }
        .uc-tab { padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #fecaca; background: #fff; color: #888; transition: all 0.15s; font-family: inherit; }
        .uc-tab.active { background: #7f1d1d; color: #fff; border-color: #7f1d1d; }
        .uc-empty { background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 40px; text-align: center; font-size: 13px; color: #aaa; }
        .uc-error { font-size: 13px; color: #b91c1c; background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 9px 13px; margin-bottom: 12px; }
        .uc-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(12px); background: #1a1a1a; color: #fff; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.2s, transform 0.2s; z-index: 200; border-left: 3px solid #15803d; max-width: 90vw; }
        .uc-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .uc-back { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: 1px solid #fecaca; border-radius: 8px; background: #fff; color: #b91c1c; font-size: 12px; font-weight: 600; text-decoration: none; margin-bottom: 14px; transition: background 0.15s; }
        .uc-back:hover { background: #fef2f2; }
      `}</style>

      <main className="uc-page">
        <AppNav />
        <div className="uc-shell">

          <Link href="/user/dashboard" className="uc-back">← Back to Dashboard</Link>

          {/* Header */}
          <div className="uc-header">
            <div className="uc-eyebrow">User</div>
            <div className="uc-title">My Contracts</div>
            <div className="uc-sub">View, manage and renew your service contracts.</div>
          </div>

          {error && <p className="uc-error">{error}</p>}

          {/* Stats */}
          {!loading && (
            <div className="uc-stats">
              <div className="uc-stat">
                <div className="uc-stat-n" style={{ color: stats.active > 0 ? "#15803d" : "#111" }}>{stats.active}</div>
                <div className="uc-stat-l">Active Contracts</div>
              </div>
              <div className="uc-stat">
                <div className="uc-stat-n">{stats.completed}</div>
                <div className="uc-stat-l">Completed</div>
              </div>
              <div className="uc-stat">
                <div className="uc-stat-n" style={{ color: stats.expiring > 0 ? "#c2410c" : "#111" }}>{stats.expiring}</div>
                <div className="uc-stat-l">Expiring Soon</div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="uc-tabs">
            {[["active",`Active (${stats.active})`],["completed",`Completed (${stats.completed})`],["all","All Contracts"]].map(([id, lbl]) => (
              <button key={id} className={`uc-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{lbl}</button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="uc-empty">Loading contracts…</div>
          ) : filtered.length === 0 ? (
            <div className="uc-empty">
              <div style={{ fontSize:32, marginBottom:10 }}>📄</div>
              {tab === "active"
                ? "No active contracts. Book a contract-based service to get started."
                : "No contracts found for this view."}
              {tab === "active" && (
                <div style={{ marginTop:14 }}>
                  <Link href="/services" style={{ padding:"9px 20px", background:"#7f1d1d", color:"#fff", borderRadius:10, textDecoration:"none", fontSize:13, fontWeight:700, display:"inline-block" }}>
                    Browse Services →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            filtered.map((contract) => (
              <ContractCard
                key={contract._id}
                contract={contract}
                onRenew={setRenewingContract}
              />
            ))
          )}

        </div>
      </main>

      {/* Renew Modal */}
      {renewingContract && (
        <RenewModal
          contract={renewingContract}
          onClose={() => setRenewingContract(null)}
          onSuccess={handleRenewSuccess}
        />
      )}

      {/* Toast */}
      <div className={`uc-toast ${toast.show ? "show" : ""}`}>{toast.msg}</div>
    </>
  );
}
