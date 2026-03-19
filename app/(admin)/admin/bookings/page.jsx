"use client";

import { useState } from "react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  async function loadBookings() {
    setError("");
    try {
      const response = await fetch("/api/bookings");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch bookings");
      setBookings(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-4 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Admin Bookings</h1>
        <button onClick={loadBookings} className="rounded bg-slate-900 px-4 py-2 text-white">
          Load Bookings
        </button>
        {error ? <p className="text-red-600">{error}</p> : null}
        <div className="space-y-2">
          {bookings.map((booking) => (
            <div key={booking._id} className="rounded border p-3">
              <p className="text-sm">Booking: {booking._id}</p>
              <p className="text-sm">User: {booking.userId?.name || booking.userId}</p>
              <p className="text-sm">Provider: {booking.providerId?.businessName || booking.providerId}</p>
              <p className="text-sm">Status: {booking.status}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
