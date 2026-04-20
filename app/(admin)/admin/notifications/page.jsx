"use client";

import { useEffect, useState } from "react";

const notificationTypeIcons = {
  booking: "📅",
  payment: "💳",
  review: "⭐",
  warning: "⚠️",
  service_request: "🔔",
};

const notificationTypeColors = {
  booking: "#eff6ff",
  payment: "#ecfdf5",
  review: "#fffbeb",
  warning: "#fef2f2",
  service_request: "#fef3c7",
};

const notificationTypeBorders = {
  booking: "#3b82f6",
  payment: "#10b981",
  review: "#f59e0b",
  warning: "#ef4444",
  service_request: "#f59e0b",
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=100");
      const data = await res.json();
      
      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId) {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => 
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function deleteNotification(notificationId, e) {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  function getRecipientInfo(notif) {
    if (notif.userId) return { type: "User", id: notif.userId };
    if (notif.providerId) return { type: "Provider", id: notif.providerId };
    if (notif.adminId) return { type: "Admin", id: notif.adminId };
    return { type: "Unknown", id: "N/A" };
  }

  const filteredNotifications = filterType === "all" 
    ? notifications 
    : notifications.filter(n => n.type === filterType);

  const notificationTypes = ["all", ...new Set(notifications.map(n => n.type))];

  return (
    <div style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111" }}>All Notifications</h1>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>System-wide notification activity</p>
      </div>

      {/* Filter Buttons */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {notificationTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              background: filterType === type ? "#3b82f6" : "#e5e7eb",
              color: filterType === type ? "#fff" : "#111",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              if (filterType !== type) {
                e.target.style.background = "#d1d5db";
              }
            }}
            onMouseLeave={(e) => {
              if (filterType !== type) {
                e.target.style.background = "#e5e7eb";
              }
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            {" "}({notifications.filter(n => filterType === "all" ? true : n.type === type).length})
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", minHeight: "300px" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontSize: "16px" }}>No notifications found.</div>
          </div>
        ) : (
          <div>
            {filteredNotifications.map((notif) => {
              const recipient = getRecipientInfo(notif);
              return (
                <div
                  key={notif._id}
                  style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid #f3f4f6",
                    background: notif.isRead ? "#fff" : notificationTypeColors[notif.type] || "#f9fafb",
                    borderLeft: `4px solid ${!notif.isRead ? (notificationTypeBorders[notif.type] || "#3b82f6") : "transparent"}`,
                    display: "flex",
                    gap: "16px"
                  }}
                  onMouseEnter={(e) => {
                    if (!notif.isRead) {
                      e.currentTarget.style.background = "#f3f4f6";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!notif.isRead) {
                      e.currentTarget.style.background = notificationTypeColors[notif.type] || "#f9fafb";
                    }
                  }}
                >
                  <div style={{ fontSize: "28px", flexShrink: 0, marginTop: "4px" }}>
                    {notificationTypeIcons[notif.type] || "🔔"}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: notif.isRead ? "600" : "700", color: "#111" }}>
                          {notif.title || notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                          To: <strong>{recipient.type}</strong> • {formatTime(notif.createdAt)}
                        </div>
                      </div>
                      <div style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background: "#f3f4f6",
                        color: "#6b7280",
                        whiteSpace: "nowrap"
                      }}>
                        {notif.type}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.5", marginBottom: "8px" }}>
                      {notif.message}
                    </div>

                    {/* Metadata */}
                    {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                      <div style={{
                        background: "#f9fafb",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        marginBottom: "8px",
                        fontSize: "12px",
                        color: "#6b7280"
                      }}>
                        <details>
                          <summary style={{ cursor: "pointer", fontWeight: "600", color: "#111" }}>Metadata</summary>
                          <div style={{ marginTop: "8px", paddingLeft: "12px", borderLeft: "2px solid #e5e7eb" }}>
                            {JSON.stringify(notif.metadata, null, 2).split('\n').map((line, idx) => (
                              <div key={idx} style={{ fontFamily: "monospace", fontSize: "11px" }}>{line}</div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                    
                    <div style={{ display: "flex", gap: "12px", marginTop: "12px", flexWrap: "wrap" }}>
                      <button
                        onClick={(e) => deleteNotification(notif._id, e)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                          padding: 0,
                          marginLeft: "auto"
                        }}
                      >
                        Delete
                      </button>
                      
                      {!notif.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif._id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#3b82f6",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: 0
                          }}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
