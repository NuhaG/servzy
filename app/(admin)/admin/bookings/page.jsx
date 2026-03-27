"use client";

import { useState } from "react";
import { useEffect } from "react";
import AppNav from "@/components/AppNav";

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

  useEffect(() => {
    loadBookings();
  }, []);

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-4">
        <div className="sv-card p-6 space-y-4">
        <h1 className="sv-title">Admin Bookings</h1>
        <button onClick={loadBookings} className="sv-btn">
          Load Bookings
        </button>
        {error ? <p className="text-red-700">{error}</p> : null}
        <div className="space-y-2">
          {bookings.map((booking) => (
            <div key={booking._id} className="sv-card p-3">
              <p className="text-sm">Booking: {booking._id}</p>
              <p className="text-sm">User: {booking.userId?.name || booking.userId}</p>
              <p className="text-sm">Provider: {booking.providerId?.businessName || booking.providerId}</p>
              <p className="text-sm">Status: {booking.status}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </main>
  );
}
