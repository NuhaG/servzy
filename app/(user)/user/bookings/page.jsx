"use client";

import { useCallback, useEffect, useState } from "react";

export default function UserBookingsPage() {
  const [userId, setUserId] = useState("");
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function displayStatus(status) {
    if (status === "accepted") return "confirmed";
    return status;
  }

  const loadBookings = useCallback(async (activeUserId = userId) => {
    if (!activeUserId) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/bookings?userId=${encodeURIComponent(activeUserId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch bookings");
      setBookings(data);
    } catch (err) {
      setError(err.message);
    }
  }, [userId]);

  useEffect(() => {
    async function loadContext() {
      try {
        const response = await fetch("/api/demo/context");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load demo context");
        const demoUserId = data.currentUser?._id || "";
        setUserId(demoUserId);
        await loadBookings(demoUserId);
      } catch (err) {
        setError(err.message);
      }
    }

    loadContext();
  }, [loadBookings]);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">User Bookings</h1>

        <div className="flex gap-2">
          <input
            className="w-full rounded border p-2"
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <button
            type="button"
            onClick={loadBookings}
            className="rounded bg-slate-800 px-4 py-2 text-white"
          >
            Load
          </button>
        </div>

        {message ? <p className="text-green-700">{message}</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        <div className="space-y-2">
          {bookings.map((booking) => (
            <div key={booking._id} className="rounded border p-3">
              <p className="text-sm">Booking: {booking._id}</p>
              <p className="text-sm">Provider: {booking.providerId?.businessName || "-"}</p>
              <p className="text-sm">Service: {booking.serviceId?.title || booking.serviceId}</p>
              <p className="text-sm">Status: {displayStatus(booking.status)}</p>
              <p className="text-sm">Amount: Rs. {booking.amount || booking.serviceId?.price || 0}</p>
              <p className="text-sm">Slot: {booking.timeSlot}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
