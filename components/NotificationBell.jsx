"use client";

import { useEffect, useRef, useState } from "react";

const notificationTypeIcons = {
  booking: "📅",
  payment: "💳",
  review: "⭐",
  warning: "⚠️",
  service_request: "🔔",
};

const notificationTypeColors = {
  booking: "#3b82f6",
  payment: "#10b981",
  review: "#f59e0b",
  warning: "#ef4444",
  service_request: "#f59e0b",
};

const roleNotificationHref = {
  admin: "/admin/notifications",
  provider: "/provider/bookings?tab=requests",
  user: "/user/notifications",
};

export default function NotificationBell({ role = "user" }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);

  const destinationHref =
    roleNotificationHref[role] || roleNotificationHref.user;

  async function loadNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=10");
      const data = await res.json();

      if (!res.ok) {
        console.error("Notification API error:", data.error);
        return;
      }

      console.log("Loaded notifications:", data.notifications);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      loadNotifications();
    }, 0);
    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
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

  async function markAsRead(notificationId) {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      if (res.ok) {
        await loadNotifications();
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
        await loadNotifications();
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
            left: "-260%",
            transform: "translateX(-50%)",
            marginTop: "8px",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow:
              "0 10px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
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
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#f9fafb",
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
                  color: "#3b82f6",
                  background: "#eff6ff",
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
                color: "#9ca3af",
                fontSize: "13px",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📭</div>
              <div>No notifications yet</div>
            </div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <a
                  key={notif._id}
                  href={notif.actionUrl || destinationHref}
                  onClick={() => {
                    // Fire and forget read status update without blocking navigation!
                    if (!notif.isRead) {
                      markAsRead(notif._id);
                    }
                  }}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    padding: "12px 16px",
                    borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer",
                    background: notif.isRead ? "#fff" : "#eff6ff",
                    transition: "background 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = notif.isRead
                      ? "#f9fafb"
                      : "#dbeafe";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.isRead
                      ? "#fff"
                      : "#eff6ff";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
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
                          fontWeight: notif.isRead ? "500" : "700",
                          color: "#111",
                          marginBottom: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {notif.title ||
                          notif.type.charAt(0).toUpperCase() +
                            notif.type.slice(1)}
                        {!notif.isRead && (
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background:
                                notificationTypeColors[notif.type] || "#3b82f6",
                            }}
                          ></span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#4b5563",
                          lineHeight: "1.4",
                          marginBottom: "4px",
                        }}
                      >
                        {notif.message}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9ca3af",
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
                        color: "#d1d5db",
                        flexShrink: 0,
                        opacity: 0,
                        transition: "opacity 0.15s, color 0.15s",
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
                </a>
              ))}
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #e5e7eb",
                textAlign: "center",
                background: "#f9fafb",
                borderRadius: "0 0 12px 12px",
              }}
            >
              <a
                href={destinationHref}
                onClick={() => {
                  setOpen(false);
                }}
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#3b82f6",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                View all notifications →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
