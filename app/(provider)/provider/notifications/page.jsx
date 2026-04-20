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

export default function ProviderNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
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

  async function handleServiceRequestAction(notificationId, action, e) {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${notificationId}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId
              ? { ...n, actionStatus: action === "accept" ? "accepted" : "rejected" }
              : n
          )
        );
      } else {
        const error = await res.json();
        console.error("Failed to process action:", error);
      }
    } catch (err) {
      console.error("Failed to handle service request action:", err);
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
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111" }}>Service Requests</h1>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>Review and respond to booking requests from customers</p>
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", minHeight: "300px" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>Loading requests...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "#9ca3af" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
            <div style={{ fontSize: "16px" }}>No booking requests yet.</div>
          </div>
        ) : (
          <div>
            {notifications.map((notif) => (
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
              >
                <div style={{ fontSize: "28px", flexShrink: 0, marginTop: "4px" }}>
                  {notificationTypeIcons[notif.type] || "🔔"}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "16px", fontWeight: notif.isRead ? "600" : "700", color: "#111" }}>
                        {notif.title || "New Service Request"}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                        {formatTime(notif.createdAt)}
                      </div>
                    </div>
                    {notif.actionStatus !== "pending" && (
                      <div style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        background: notif.actionStatus === "accepted" ? "#d1fae5" : "#fee2e2",
                        color: notif.actionStatus === "accepted" ? "#047857" : "#b91c1c",
                      }}>
                        {notif.actionStatus === "accepted" ? "✓ Accepted" : "✕ Rejected"}
                      </div>
                    )}
                  </div>

                  {/* Service Request Details Card */}
                  {notif.metadata && (
                    <div style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "16px",
                      fontSize: "13px"
                    }}>
                      <div style={{ marginBottom: "12px" }}>
                        <strong style={{ color: "#111" }}>📋 Service Details</strong>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                        <div>
                          <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Service</div>
                          <div style={{ color: "#111", fontWeight: "600" }}>{notif.metadata.serviceName}</div>
                        </div>
                        <div>
                          <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Amount</div>
                          <div style={{ color: "#111", fontWeight: "600" }}>₹{notif.metadata.amount}</div>
                        </div>
                        <div>
                          <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Date & Time</div>
                          <div style={{ color: "#111", fontWeight: "600" }}>
                            {notif.metadata.scheduledDate ? new Date(notif.metadata.scheduledDate).toLocaleDateString() : "N/A"} @ {notif.metadata.timeSlot}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Customer</div>
                          <div style={{ color: "#111", fontWeight: "600" }}>{notif.metadata.customerName}</div>
                        </div>
                      </div>
                      {notif.metadata.serviceDescription && (
                        <div style={{ marginBottom: "8px" }}>
                          <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Description</div>
                          <div style={{ color: "#4b5563" }}>{notif.metadata.serviceDescription}</div>
                        </div>
                      )}
                      {notif.metadata.notes && (
                        <div>
                          <div style={{ color: "#6b7280", fontSize: "12px", marginBottom: "4px" }}>Customer Notes</div>
                          <div style={{ color: "#4b5563" }}>{notif.metadata.notes}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {notif.actionStatus === "pending" && (
                      <>
                        <button
                          onClick={(e) => handleServiceRequestAction(notif._id, "accept", e)}
                          style={{
                            background: "#10b981",
                            border: "none",
                            color: "#fff",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#059669";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "#10b981";
                          }}
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={(e) => handleServiceRequestAction(notif._id, "reject", e)}
                          style={{
                            background: "#ef4444",
                            border: "none",
                            color: "#fff",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#dc2626";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "#ef4444";
                          }}
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}
                    
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
