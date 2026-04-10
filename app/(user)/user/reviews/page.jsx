"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function UserReviewsPage() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedBooking = bookings.find((booking) => booking._id === selectedBookingId);
  const selectedServiceId = selectedBooking?.serviceId?._id || "";

  async function loadReviews(serviceId) {
    if (!serviceId) {
      setReviews([]);
      return;
    }

    const response = await fetch(`/api/reviews?serviceId=${encodeURIComponent(serviceId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to load reviews");
    setReviews(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    async function loadPage() {
      try {
        setError("");
        const meResponse = await fetch("/api/me");
        const meData = await meResponse.json();
        if (!meResponse.ok) throw new Error(meData.error || "Failed to load user");

        const bookingResponse = await fetch(`/api/bookings?userId=${encodeURIComponent(meData.user._id)}`);
        const bookingData = await bookingResponse.json();
        if (!bookingResponse.ok) throw new Error(bookingData.error || "Failed to load bookings");

        const completed = (bookingData || []).filter((item) => item.status === "completed");
        setUser(meData.user);
        setBookings(completed);
        if (completed[0]) {
          setSelectedBookingId(completed[0]._id);
          await loadReviews(completed[0].serviceId?._id);
        }
      } catch (err) {
        setError(err.message);
      }
    }

    loadPage();
  }, []);

  async function submitReview(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!user || !selectedBooking) return;

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          serviceId: selectedBooking.serviceId?._id,
          bookingId: selectedBooking._id,
          rating: Number(rating),
          comment,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit review");
      setMessage("Review submitted successfully.");
      setComment("");
      await loadReviews(selectedBooking.serviceId?._id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="sv-page">
      <AppNav />
      <div className="sv-shell space-y-6">
        <div className="sv-card p-6 space-y-4">
        <h1 className="sv-title">My Reviews</h1>
        {error ? <p className="text-red-700">{error}</p> : null}
        {message ? <p className="text-green-700">{message}</p> : null}

        <form onSubmit={submitReview} className="grid gap-3 sm:grid-cols-2">
          <select
            className="sv-input sm:col-span-2"
            value={selectedBookingId}
            onChange={async (event) => {
              const bookingId = event.target.value;
              setSelectedBookingId(bookingId);
              const booking = bookings.find((item) => item._id === bookingId);
              await loadReviews(booking?.serviceId?._id);
            }}
          >
            <option value="">Select completed booking</option>
            {bookings.map((booking) => (
              <option key={booking._id} value={booking._id}>
                {booking.serviceId?.title || "Service"} | {booking.timeSlot}
              </option>
            ))}
          </select>
          <input
            className="sv-input"
            type="number"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            required
          />
          <input
            className="sv-input sm:col-span-2"
            placeholder="Write your review..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="sv-btn sm:col-span-2">
            Submit Review
          </button>
        </form>

        <div className="space-y-2">
          {reviews.map((review) => (
            <div key={review._id} className="sv-card p-3">
              <p className="text-sm font-medium">Rating: {review.rating}/5</p>
              <p className="text-sm">Comment: {review.comment || "-"}</p>
            </div>
          ))}
          {!error && reviews.length === 0 ? <p className="text-sm text-slate-500">No reviews for this service yet.</p> : null}
        </div>
        </div>
      </div>
    </main>
  );
}
