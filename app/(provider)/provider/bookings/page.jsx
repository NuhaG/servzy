"use client";

import { useCallback, useEffect, useState } from "react";

export default function ProviderBookingsPage() {
  const [providerId, setProviderId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function displayStatus(status) {
    if (status === "accepted") return "confirmed";
    return status;
  }

  const loadBookings = useCallback(async () => {
    if (!providerId) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/bookings?providerId=${encodeURIComponent(providerId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch bookings");
      setBookings(data);
    } catch (err) {
      setError(err.message);
    }
  }, [providerId]);

  async function updateStatus(bookingId, status) {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update status");
      setMessage(`Booking ${bookingId} updated to ${data.status}`);
      await loadBookings();
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    async function loadContext() {
      try {
        const response = await fetch("/api/demo/context");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load demo context");
        const demoProviderId = data.primaryProvider?._id || "";
        setProviderId(demoProviderId);
      } catch (err) {
        setError(err.message);
      }
    }
    loadContext();
  }, []);

  useEffect(() => {
    if (providerId) {
      loadBookings();
    }
  }, [providerId, loadBookings]);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Provider Bookings</h1>
        <div className="flex gap-2">
          <input
            className="w-full rounded border p-2"
            placeholder="Provider ID"
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
          />
          <button onClick={loadBookings} className="rounded bg-slate-900 px-4 py-2 text-white">
            Load
          </button>
        </div>

        {message ? <p className="text-green-700">{message}</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking._id} className="rounded border p-3">
              <p className="text-sm font-medium">{booking.serviceId?.title || booking.serviceId}</p>
              <p className="text-sm">Booking: {booking._id}</p>
              <p className="text-sm">Status: {displayStatus(booking.status)}</p>
              <p className="text-sm">Slot: {booking.timeSlot}</p>
              <p className="text-sm">Amount: Rs. {booking.amount || booking.serviceId?.price || 0}</p>
              {booking.status === "pending" ? (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => updateStatus(booking._id, "accepted")}
                    className="rounded bg-green-700 px-3 py-1 text-sm text-white"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(booking._id, "rejected")}
                    className="rounded bg-red-700 px-3 py-1 text-sm text-white"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
              {booking.status === "accepted" ? (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => updateStatus(booking._id, "completed")}
                    className="rounded bg-blue-700 px-3 py-1 text-sm text-white"
                  >
                    Mark Completed
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
