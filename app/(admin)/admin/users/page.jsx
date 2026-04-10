"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState("");
  const [statuses, setStatuses] = useState({}); // { [userId]: { flagged, blocked } }
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  async function loadUsers(targetPage) {
    setError("");
    try {
      const response = await fetch(`/api/users?page=${targetPage}&limit=20`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch users");
      setUsers(data.users || []);
      setMeta(data);
      setPage(targetPage);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadUsers(1);
  }, []);

  function showToast(msg) {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  function toggleFlag(userId) {
    const current = statuses[userId] || {};
    if (current.blocked) {
      showToast("Unblock this user before flagging.");
      return;
    }
    const nowFlagged = !current.flagged;
    setStatuses((prev) => ({
      ...prev,
      [userId]: { ...current, flagged: nowFlagged },
    }));
    showToast(nowFlagged ? "🚩 This user has been flagged." : "Flag removed.");
  }

  function toggleBlock(userId) {
    const current = statuses[userId] || {};
    const nowBlocked = !current.blocked;
    setStatuses((prev) => ({
      ...prev,
      [userId]: { flagged: false, blocked: nowBlocked },
    }));
    showToast(nowBlocked ? "🚫 This user has been blocked." : "User has been unblocked.");
  }

  return (
    <>
      <style>{`
        .aup-page { min-height: 100vh; background: #fef2f2; }
        .aup-shell { max-width: 860px; margin: 0 auto; padding: 36px 20px 64px; }

        /* Header */
        .aup-header {
          background: #fff; border: 1px solid #fecaca; border-left: 4px solid #b91c1c;
          border-radius: 12px; padding: 22px 28px; margin-bottom: 14px;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
        }
        .aup-header-title { font-size: 22px; font-weight: 700; color: #111; letter-spacing: -0.02em; margin: 0 0 2px; }
        .aup-header-meta { font-size: 13px; color: #888; }
        .aup-reload {
          padding: 8px 18px; background: #7f1d1d; color: #fff; border: none;
          border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: background 0.15s;
        }
        .aup-reload:hover { background: #991b1b; }

        /* Error */
        .aup-error {
          font-size: 13px; color: #b91c1c; background: #fff1f2;
          border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px;
        }

        /* User cards */
        .aup-list { display: flex; flex-direction: column; gap: 10px; }
        .aup-user-card {
          background: #fff; border: 1px solid #fecaca; border-radius: 12px;
          padding: 16px 20px; display: flex; align-items: center;
          justify-content: space-between; gap: 14px;
          transition: box-shadow 0.15s;
        }
        .aup-user-card:hover { box-shadow: 0 2px 10px rgba(185,28,28,0.07); }
        .aup-user-card.flagged { border-color: #f97316; background: #fff7ed; }
        .aup-user-card.blocked { border-color: #b91c1c; background: #fff1f2; opacity: 0.72; }

        .aup-user-info { flex: 1; min-width: 0; }
        .aup-user-name-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .aup-user-name { font-size: 14px; font-weight: 600; color: #111; }
        .aup-user-email { font-size: 12px; color: #888; margin-top: 2px; }
        .aup-user-role {
          display: inline-block; margin-top: 5px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;
          padding: 2px 8px; border-radius: 20px;
          background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;
        }

        /* Status badges */
        .aup-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 20px;
        }
        .aup-badge.flagged { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
        .aup-badge.blocked { background: #fff1f2; color: #b91c1c; border: 1px solid #fecaca; }

        /* Action buttons */
        .aup-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .aup-btn {
          padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1px solid; transition: all 0.15s; white-space: nowrap;
        }
        .aup-flag { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
        .aup-flag:hover { background: #ffedd5; border-color: #f97316; }
        .aup-flag.active { background: #f97316; color: #fff; border-color: #ea580c; }
        .aup-block { background: #fff1f2; color: #b91c1c; border-color: #fecaca; }
        .aup-block:hover { background: #ffe4e6; border-color: #f87171; }
        .aup-block.active { background: #b91c1c; color: #fff; border-color: #991b1b; }

        /* Pagination */
        .aup-pagination { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
        .aup-page-btn {
          padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; border: 1px solid #fecaca;
          background: #fff; color: #7f1d1d;
        }
        .aup-page-btn:hover:not(:disabled) { background: #7f1d1d; color: #fff; border-color: #7f1d1d; }
        .aup-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Toast */
        .aup-toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(10px);
          background: #1a1a1a; color: #fff; padding: 10px 20px;
          border-radius: 8px; font-size: 13px; font-weight: 500;
          border-left: 3px solid #b91c1c; white-space: nowrap;
          opacity: 0; pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
          z-index: 50;
        }
        .aup-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        @media (max-width: 560px) {
          .aup-user-card { flex-direction: column; align-items: flex-start; }
          .aup-actions { width: 100%; }
          .aup-btn { flex: 1; text-align: center; }
        }
      `}</style>

      <main className="aup-page">
        <AppNav />
        <div className="aup-shell">

          {/* Header */}
          <div className="aup-header">
            <div>
              <h1 className="aup-header-title">Admin — Users</h1>
              {meta && (
                <p className="aup-header-meta">
                  Page {meta.page} of {meta.totalPages} &nbsp;|&nbsp; Total: {meta.totalUsers}
                </p>
              )}
            </div>
            <button className="aup-reload" onClick={() => loadUsers(page)}>
              ↺ &nbsp;Reload
            </button>
          </div>

          {error && <p className="aup-error">{error}</p>}

          {/* User list */}
          <div className="aup-list">
            {users.map((user) => {
              const s = statuses[user._id] || {};
              const cardClass = s.blocked ? "blocked" : s.flagged ? "flagged" : "";
              return (
                <div key={user._id} className={`aup-user-card ${cardClass}`}>
                  <div className="aup-user-info">
                    <div className="aup-user-name-row">
                      <span className="aup-user-name">{user.name || "Unnamed User"}</span>
                      {s.flagged && <span className="aup-badge flagged">🚩 Flagged</span>}
                      {s.blocked && <span className="aup-badge blocked">🚫 Blocked</span>}
                    </div>
                    <div className="aup-user-email">{user.email}</div>
                    <span className="aup-user-role">{user.role}</span>
                  </div>
                  <div className="aup-actions">
                    <button
                      className={`aup-btn aup-flag ${s.flagged ? "active" : ""}`}
                      onClick={() => toggleFlag(user._id)}
                    >
                      🚩 {s.flagged ? "Unflag" : "Flag"}
                    </button>
                    <button
                      className={`aup-btn aup-block ${s.blocked ? "active" : ""}`}
                      onClick={() => toggleBlock(user._id)}
                    >
                      🚫 {s.blocked ? "Unblock" : "Block"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && (
            <div className="aup-pagination">
              <button
                className="aup-page-btn"
                disabled={page <= 1}
                onClick={() => loadUsers(page - 1)}
              >
                ← Prev
              </button>
              <button
                className="aup-page-btn"
                disabled={page >= meta.totalPages}
                onClick={() => loadUsers(page + 1)}
              >
                Next →
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Toast */}
      <div className={`aup-toast ${toastVisible ? "show" : ""}`}>{toast}</div>
    </>
  );
}
