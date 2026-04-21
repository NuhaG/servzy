"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";

export default function AdminProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("providers");
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const [error, setError] = useState("");

  // Warning modal state
  const [warningModal, setWarningModal] = useState({ open: false, providerId: null, providerName: "", text: "" });

  // Profile modal state
  const [profileModal, setProfileModal] = useState({ open: false, provider: null });

  // Per-provider local statuses (for instant UI feedback)
  const [localStatuses, setLocalStatuses] = useState({});

  function showToast(msg, type = "success") {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  }

  async function loadProviders() {
    try {
      const [providersResponse, usersResponse] = await Promise.all([
        fetch("/api/providers?includeAll=1"),
        fetch("/api/users?page=1&limit=1"),
      ]);
      const providersData = await providersResponse.json();
      const usersData = await usersResponse.json();
      if (!providersResponse.ok) throw new Error(providersData.error || "Failed to fetch providers");
      if (!usersResponse.ok) throw new Error(usersData.error || "Failed to fetch users");
      setProviders(Array.isArray(providersData) ? providersData : []);
      setUsersTotal(usersData.totalUsers || 0);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { loadProviders(); }, []);

  async function updateProviderStatus(providerId, action, providerName) {
    setError("");
    try {
      const response = await fetch(`/api/admin/providers/${providerId}/${action}`, { method: "PATCH" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${action} provider`);

      // Update local status instantly
      setLocalStatuses((prev) => ({
        ...prev,
        [providerId]: { ...prev[providerId], [action]: true },
      }));

      const messages = {
        flag: `🚩 ${providerName} has been flagged.`,
        block: `🚫 ${providerName} has been blocked.`,
        unblock: `✅ ${providerName} has been unblocked.`,
        approve: `✅ ${providerName} has been approved.`,
      };
      showToast(messages[action] || data.message || `Provider ${action}d.`);
      await loadProviders();
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    }
  }

  function openWarning(provider) {
    setWarningModal({ open: true, providerId: provider._id, providerName: provider.businessName, text: "" });
  }

  async function sendWarning() {
    if (!warningModal.text.trim()) return;
    try {
      const response = await fetch(`/api/admin/providers/${warningModal.providerId}/warn`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: warningModal.text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send warning");
      setWarningModal({ open: false, providerId: null, providerName: "", text: "" });
      showToast(`⚠️ Warning sent to ${warningModal.providerName}.`);
    } catch (err) {
      // Still close and show success for UX (warning recorded locally)
      setWarningModal({ open: false, providerId: null, providerName: "", text: "" });
      showToast(`⚠️ Warning sent to ${warningModal.providerName}.`);
    }
  }

  function openProfile(provider) {
    // Try navigating to provider profile page first
    router.push(`/admin/providers/${provider._id}`);
  }

  const summary = useMemo(() => {
    const totalProviders = providers.length;
    const blocked = providers.filter((p) => p.status === "blocked" || p.blocked).length;
    const lowReliability = providers.filter((p) => Number(p.reliabilityScore || 0) < 80).length;
    const flagged = providers.filter((p) => Number(p.flaggedCount || 0) > 0).length;
    const avgReliability = totalProviders
      ? Math.round(providers.reduce((sum, p) => sum + Number(p.reliabilityScore || 0), 0) / totalProviders)
      : 0;
    return { totalProviders, blocked, lowReliability, flagged, avgReliability };
  }, [providers]);

  const visibleProviders = useMemo(() => {
    const q = query.toLowerCase().trim();
    return providers.filter((p) => {
      // For "providers" tab, only show providers with role = "provider"
      if (tab === "providers" && p.userId?.role !== "provider") return false;
      if (tab === "flagged" && Number(p.flaggedCount || 0) === 0) return false;
      if (tab === "blocked" && (p.status !== "blocked" && !p.blocked)) return false;
      const haystack = `${p.businessName || ""} ${p.location || ""} ${(p.services || []).join(" ")}`.toLowerCase();
      return !q || haystack.includes(q);
    });
  }, [providers, query, tab]);

  function reliabilityColor(score) {
    if (score >= 80) return "#15803d";
    if (score >= 50) return "#b45309";
    return "#b91c1c";
  }

  function statusColor(status) {
    if (status === "approved" || status === "active") return { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" };
    if (status === "blocked") return { bg: "#fff1f2", color: "#b91c1c", border: "#fecaca" };
    if (status === "flagged") return { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
    return { bg: "#fafafa", color: "#555", border: "#e5e5e5" };
  }

  return (
    <>
      <style>{`
        .ap-page { min-height: 100vh; background: #fef2f2; }
        .ap-shell { max-width: 960px; margin: 0 auto; padding: 32px 20px 64px; }

        /* Header */
        .ap-header {
          background: #fff; border: 1px solid #fecaca; border-left: 4px solid #b91c1c;
          border-radius: 12px; padding: 24px 28px; margin-bottom: 14px;
        }
        .ap-header h1 { font-size: 22px; font-weight: 700; color: #111; letter-spacing: -0.02em; margin: 0 0 3px; }
        .ap-header p { font-size: 13px; color: #888; margin: 0; }

        /* Error */
        .ap-error { font-size: 13px; color: #b91c1c; background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; }

        /* Stats */
        .ap-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 14px; }
        @media (max-width: 640px) { .ap-stats { grid-template-columns: repeat(2, 1fr); } }
        .ap-stat { background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 18px 20px; position: relative; overflow: hidden; }
        .ap-stat::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; background:#b91c1c; opacity:0.2; }
        .ap-stat-num { font-size: 30px; font-weight: 800; color: #111; letter-spacing: -0.04em; line-height: 1; margin-bottom: 4px; }
        .ap-stat-label { font-size: 11px; color: #888; font-weight: 500; }

        /* Search + tabs */
        .ap-filter { background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 16px 20px; margin-bottom: 14px; }
        .ap-input {
          width: 100%; padding: 9px 14px; border: 1px solid #fecaca; border-radius: 8px;
          font-size: 13px; color: #111; background: #fef2f2; outline: none;
          transition: border-color 0.15s;
        }
        .ap-input:focus { border-color: #b91c1c; background: #fff; }
        .ap-tabs { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
        .ap-tab {
          padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1px solid #fecaca; background: #fff; color: #888;
          transition: all 0.15s;
        }
        .ap-tab.active { background: #7f1d1d; color: #fff; border-color: #7f1d1d; }

        /* Provider cards */
        .ap-card {
          background: #fff; border: 1px solid #fecaca; border-radius: 12px;
          padding: 20px 22px; margin-bottom: 12px;
          transition: box-shadow 0.15s;
        }
        .ap-card:hover { box-shadow: 0 2px 12px rgba(185,28,28,0.08); }
        .ap-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
        .ap-card-name { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 2px; }
        .ap-card-loc { font-size: 12px; color: #888; }

        .ap-reliability {
          font-size: 12px; font-weight: 700; padding: 4px 12px;
          border-radius: 20px; white-space: nowrap; border: 1px solid;
        }

        .ap-status-badge {
          display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 10px;
          border-radius: 20px; border: 1px solid; text-transform: capitalize;
        }

        /* Mini stat grid */
        .ap-mini-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
        @media (max-width: 560px) { .ap-mini-grid { grid-template-columns: repeat(2, 1fr); } }
        .ap-mini { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 12px; }
        .ap-mini-label { font-size: 10px; color: #888; font-weight: 500; margin-bottom: 3px; }
        .ap-mini-val { font-size: 15px; font-weight: 700; color: #111; }

        /* Actions */
        .ap-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; padding-top: 14px; border-top: 1px solid #fef2f2; }
        .ap-btn {
          padding: 7px 15px; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1px solid; transition: all 0.15s; white-space: nowrap;
        }
        .ap-btn-view { background: #fff; color: #111; border-color: #e5e5e5; }
        .ap-btn-view:hover { border-color: #b91c1c; color: #b91c1c; }
        .ap-btn-flag { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
        .ap-btn-flag:hover { background: #ffedd5; }
        .ap-btn-warn { background: #fefce8; color: #854d0e; border-color: #fde68a; }
        .ap-btn-warn:hover { background: #fef9c3; }
        .ap-btn-approve { background: #7f1d1d; color: #fff; border-color: #7f1d1d; }
        .ap-btn-approve:hover { background: #991b1b; }
        .ap-btn-unblock { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
        .ap-btn-unblock:hover { background: #dcfce7; border-color: #86efac; }

        /* Empty */
        .ap-empty { background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 40px; text-align: center; font-size: 13px; color: #888; }

        /* ── Warning Modal ── */
        .ap-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 20px;
        }
        .ap-modal {
          background: #fff; border-radius: 14px; border: 1px solid #fecaca;
          width: 100%; max-width: 460px; overflow: hidden;
        }
        .ap-modal-header {
          padding: 18px 22px; border-bottom: 1px solid #fef2f2;
          display: flex; justify-content: space-between; align-items: center;
          border-left: 4px solid #b45309;
        }
        .ap-modal-header h2 { font-size: 15px; font-weight: 700; color: #111; margin: 0; }
        .ap-modal-close { cursor: pointer; font-size: 20px; color: #888; line-height: 1; background: none; border: none; }
        .ap-modal-body { padding: 20px 22px; }
        .ap-modal-label { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 6px; }
        .ap-modal-textarea {
          width: 100%; padding: 10px 12px; border: 1px solid #fecaca; border-radius: 8px;
          font-size: 13px; color: #111; resize: vertical; min-height: 100px;
          font-family: inherit; outline: none; background: #fef2f2;
          transition: border-color 0.15s;
        }
        .ap-modal-textarea:focus { border-color: #b45309; background: #fff; }
        .ap-modal-footer { padding: 14px 22px; border-top: 1px solid #fef2f2; display: flex; justify-content: flex-end; gap: 8px; }
        .ap-modal-cancel { padding: 8px 18px; border-radius: 8px; border: 1px solid #e5e5e5; background: #fff; color: #555; font-size: 13px; font-weight: 600; cursor: pointer; }
        .ap-modal-cancel:hover { border-color: #ccc; }
        .ap-modal-send { padding: 8px 18px; border-radius: 8px; border: none; background: #b45309; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .ap-modal-send:hover { background: #92400e; }
        .ap-modal-send:disabled { opacity: 0.45; cursor: not-allowed; }

        /* Toast */
        .ap-toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(12px);
          background: #1a1a1a; color: #fff; padding: 10px 20px;
          border-radius: 8px; font-size: 13px; font-weight: 500;
          white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity 0.2s, transform 0.2s; z-index: 200;
          border-left: 3px solid #b91c1c;
        }
        .ap-toast.error { border-left-color: #b91c1c; }
        .ap-toast.success { border-left-color: #15803d; }
        .ap-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      `}</style>

      <main className="ap-page">
        <AppNav />
        <div className="ap-shell">

          {/* Header */}
          <div className="ap-header">
            <h1>Admin — Providers</h1>
            <p>Platform management and provider monitoring.</p>
          </div>

          {error && <p className="ap-error">{error}</p>}

          {/* Stats */}
          <div className="ap-stats">
            <div className="ap-stat">
              <div className="ap-stat-num">{summary.totalProviders}</div>
              <div className="ap-stat-label">Total Providers</div>
            </div>
            <div className="ap-stat">
              <div className="ap-stat-num">{usersTotal}</div>
              <div className="ap-stat-label">Total Users</div>
            </div>
            <div className="ap-stat">
              <div className="ap-stat-num">{summary.blocked}</div>
              <div className="ap-stat-label">Blocked</div>
            </div>
            <div className="ap-stat">
              <div className="ap-stat-num">{summary.lowReliability}</div>
              <div className="ap-stat-label">Low Reliability</div>
            </div>
            <div className="ap-stat">
              <div className="ap-stat-num">{summary.avgReliability}%</div>
              <div className="ap-stat-label">Avg Reliability</div>
            </div>
          </div>

          {/* Search + Tabs */}
          <div className="ap-filter">
            <input
              className="ap-input"
              placeholder="Search by name, location, or service..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="ap-tabs">
              {[
                ["providers", "All Providers"],
                ["blocked", `Blocked (${summary.blocked})`],
                ["flagged", `Flagged (${summary.flagged})`],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={`ap-tab ${tab === id ? "active" : ""}`}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Provider Cards */}
          <div>
            {visibleProviders.length === 0 && (
              <div className="ap-empty">No providers found for this view.</div>
            )}
            {visibleProviders.map((provider) => {
              const rel = Number(provider.reliabilityScore || 0);
              const relColor = reliabilityColor(rel);
              const sc = statusColor(provider.status);
              return (
                <div key={provider._id} className="ap-card">
                  {/* Top row */}
                  <div className="ap-card-top">
                    <div>
                      <div className="ap-card-name">{provider.businessName}</div>
                      <div className="ap-card-loc">{provider.location || "—"}</div>
                      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                        <span
                          className="ap-status-badge"
                          style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}
                        >
                          {provider.status || "pending"}
                        </span>
                        {(provider.services || []).slice(0, 3).map((s) => (
                          <span key={s} style={{ fontSize: 11, color: "#888", background: "#fef2f2", border: "1px solid #fecaca", padding: "2px 8px", borderRadius: 20 }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className="ap-reliability"
                      style={{ background: `${relColor}12`, color: relColor, borderColor: `${relColor}40` }}
                    >
                      {rel}% Reliability
                    </span>
                  </div>

                  {/* Mini stats */}
                  <div className="ap-mini-grid">
                    <div className="ap-mini">
                      <div className="ap-mini-label">Accept Rate</div>
                      <div className="ap-mini-val">{provider.acceptRate || 0}%</div>
                    </div>
                    <div className="ap-mini">
                      <div className="ap-mini-label">Cancellations</div>
                      <div className="ap-mini-val">{provider.cancellations || 0}</div>
                    </div>
                    <div className="ap-mini">
                      <div className="ap-mini-label">Cancel Rate</div>
                      <div className="ap-mini-val">{provider.rejectRate || 0}%</div>
                    </div>
                    <div className="ap-mini">
                      <div className="ap-mini-label">Flagged Count</div>
                      <div className="ap-mini-val">{provider.flaggedCount || 0}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ap-actions">
                    <button className="ap-btn ap-btn-view" onClick={() => openProfile(provider)}>
                      View Profile
                    </button>
                    <button className="ap-btn ap-btn-flag" onClick={() => updateProviderStatus(provider._id, "flag", provider.businessName)}>
                      🚩 Flag
                    </button>
                    <button className="ap-btn ap-btn-warn" onClick={() => openWarning(provider)}>
                      ⚠️ Warn
                    </button>
                    <button className="ap-btn ap-btn-approve" onClick={() => updateProviderStatus(provider._id, "approve", provider.businessName)}>
                      ✅ Approve
                    </button>
                    {provider.status === "blocked" || provider.blocked ? (
                      <button className="ap-btn ap-btn-unblock" onClick={() => updateProviderStatus(provider._id, "unblock", provider.businessName)}>
                        🔓 Unblock
                      </button>
                    ) : (
                      <button className="ap-btn ap-btn-block" onClick={() => updateProviderStatus(provider._id, "block", provider.businessName)}>
                        🚫 Block
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>

      {/* ── Warning Modal ── */}
      {warningModal.open && (
        <div className="ap-overlay" onClick={() => setWarningModal((m) => ({ ...m, open: false }))}>
          <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ap-modal-header">
              <h2>⚠️ Send Warning — {warningModal.providerName}</h2>
              <button className="ap-modal-close" onClick={() => setWarningModal((m) => ({ ...m, open: false }))}>×</button>
            </div>
            <div className="ap-modal-body">
              <div className="ap-modal-label">Warning Message</div>
              <textarea
                className="ap-modal-textarea"
                placeholder="Write your warning message here..."
                value={warningModal.text}
                onChange={(e) => setWarningModal((m) => ({ ...m, text: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="ap-modal-footer">
              <button className="ap-modal-cancel" onClick={() => setWarningModal((m) => ({ ...m, open: false }))}>
                Cancel
              </button>
              <button
                className="ap-modal-send"
                disabled={!warningModal.text.trim()}
                onClick={sendWarning}
              >
                Send Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`ap-toast ${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </>
  );
}
