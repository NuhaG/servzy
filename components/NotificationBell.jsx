"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const notificationTypeIcons = {
  request_sent: "📤",
  request_accepted: "✅",
  request_rejected: "❌",
  payment_made: "💳",
  payment_received: "💰",
  service_scheduled: "📅",
  warning: "⚠️",
  review_received: "⭐",
  complaint_filed: "📋",
};

const notificationTypeColors = {
  request_sent: "#3b82f6",
  request_accepted: "#10b981",
  request_rejected: "#ef4444",
  payment_made: "#f59e0b",
  payment_received: "#10b981",
  service_scheduled: "#8b5cf6",
  warning: "#f97316",
  review_received: "#f59e0b",
  complaint_filed: "#ef4444",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 15 seconds instead of 30
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=10");
      const data = await res.json();
      
      if (!res.ok) {
        console.error("Notification API error:", data.error);
        return;
      }
      
      console.log("Notifications loaded:", data);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }

  async function markAsRead(notificationId) {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        loadNotifications();
      }
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function deleteNotification(notificationId, e) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadNotifications();
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        ref={bellRef}
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "20px",
          position: "relative",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#ef4444",
              color: "#fff",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "700",
              border: "2px solid #fff",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "8px",
            background: "#fff",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            boxShadow:
              "0 10px 40px rgba(185, 28, 28, 0.15), 0 0 0 1px rgba(185, 28, 28, 0.1)",
            width: "380px",
            maxHeight: "500px",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid #fecaca",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fef2f2",
              borderRadius: "12px 12px 0 0",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#111" }}>
              Notifications
            </div>
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#b91c1c",
                  background: "#fff1f2",
                  padding: "2px 8px",
                  borderRadius: "20px",
                }}
              >
                {unreadCount} unread
              </span>
            )}
          </div>

          {/* Notifications list */}
          {notifications.length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "#aaa",
                fontSize: "13px",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📭</div>
              <div>No notifications yet</div>
            </div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && markAsRead(notif._id)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #fef2f2",
                    cursor: "pointer",
                    background: notif.read ? "#fff" : "#fff9f5",
                    transition: "background 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = notif.read ? "#fef2f2" : "#ffe8dd";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.read ? "#fff" : "#fff9f5";
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <div
                      style={{
                        fontSize: "18px",
                        flexShrink: 0,
                      }}
                    >
                      {notificationTypeIcons[notif.type] || "🔔"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: notif.read ? "500" : "700",
                          color: "#111",
                          marginBottom: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {notif.title}
                        {!notif.read && (
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: notificationTypeColors[notif.type] || "#b91c1c",
                            }}
                          ></span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          lineHeight: "1.4",
                          marginBottom: "4px",
                        }}
                      >
                        {notif.message}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#aaa",
                        }}
                      >
                        {formatTime(notif.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteNotification(notif._id, e)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "0",
                        color: "#ccc",
                        flexShrink: 0,
                        opacity: 0,
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.opacity = "1";
                        e.target.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.opacity = "0";
                      }}
                      title="Delete notification"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #fecaca",
                textAlign: "center",
                background: "#fef2f2",
                borderRadius: "0 0 12px 12px",
              }}
            >
              <Link
                href="#"
                onClick={() => setOpen(false)}
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#b91c1c",
                  textDecoration: "none",
                }}
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
