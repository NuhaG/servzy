"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const notificationTypeIcons = {
  booking: "📅",
  payment: "💳",
  review: "⭐",
  warning: "⚠️",
};

const notificationTypeColors = {
  booking: "#eff6ff", // Blue tint
  payment: "#ecfdf5", // Green tint
  review: "#fffbeb", // Yellow tint
  warning: "#fef2f2", // Red tint
};

const notificationTypeBorders = {
  booking: "#3b82f6", // Blue
  payment: "#10b981", // Green
  review: "#f59e0b", // Yellow/Amber
  warning: "#ef4444", // Red
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      // Fetch more limit for the full page
      const res = await fetch("/api/notifications?limit=50");
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
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111" }}>Your Notifications</h1>
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", minHeight: "300px" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontSize: "16px" }}>You&apos;re all caught up! No notifications yet.</div>
          </div>
        ) : (
          <div>
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={async () => {
                  if (!notif.isRead) {
                    await markAsRead(notif._id);
                  }
                  if (notif.actionUrl) {
                    router.push(notif.actionUrl);
                  }
                }}
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #f3f4f6",
                  cursor: "pointer",
                  background: notif.isRead ? "#fff" : notificationTypeColors[notif.type] || "#f9fafb",
                  borderLeft: `4px solid ${!notif.isRead ? (notificationTypeBorders[notif.type] || "#3b82f6") : "transparent"}`,
                  transition: "background 0.2s ease",
                  display: "flex",
                  gap: "16px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = notif.isRead ? "#f9fafb" : "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = notif.isRead ? "#fff" : notificationTypeColors[notif.type] || "#f9fafb";
                }}
              >
                <div style={{ fontSize: "28px", flexShrink: 0, marginTop: "4px" }}>
                  {notificationTypeIcons[notif.type] || "🔔"}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ fontSize: "16px", fontWeight: notif.isRead ? "600" : "700", color: "#111", marginBottom: "4px" }}>
                      {notif.title || notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                      {formatTime(notif.createdAt)}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "14px", color: "#4b5563", lineHeight: "1.5", marginBottom: "8px" }}>
                    {notif.message}
                  </div>
                  
                  <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                    <button
                      onClick={(e) => deleteNotification(notif._id, e)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        padding: 0
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
