"use client";

import { useEffect } from "react";
import { useState } from "react";

export default function UserReviewsPage() {
  const [serviceId, setServiceId] = useState("");
  const [userId, setUserId] = useState("");
  const [completedBookings, setCompletedBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({
    userId: "",
    serviceId: "",
    bookingId: "",
    rating: 5,
    comment: "",
  });
  const [deleteForm, setDeleteForm] = useState({ reviewId: "", userId: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadContext() {
      try {
        const contextResponse = await fetch("/api/demo/context");
        const contextData = await contextResponse.json();
        if (!contextResponse.ok) throw new Error(contextData.error || "Failed to load demo context");

        const demoUserId = contextData.currentUser?._id || "";
        setUserId(demoUserId);
        setForm((prev) => ({ ...prev, userId: demoUserId }));
        setDeleteForm((prev) => ({ ...prev, userId: demoUserId }));

        const bookingResponse = await fetch(`/api/bookings?userId=${encodeURIComponent(demoUserId)}`);
        const bookingData = await bookingResponse.json();
        if (!bookingResponse.ok) throw new Error(bookingData.error || "Failed to load bookings");

        const completed = bookingData.filter((booking) => booking.status === "completed");
        setCompletedBookings(completed);

        if (completed[0]) {
          setForm((prev) => ({
            ...prev,
            bookingId: completed[0]._id,
            serviceId: completed[0].serviceId?._id || "",
          }));
          setServiceId(completed[0].serviceId?._id || "");
        }
      } catch (err) {
        setError(err.message);
      }
    }

    loadContext();
  }, []);

  async function loadReviews() {
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/reviews?serviceId=${encodeURIComponent(serviceId)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load reviews");
      setReviews(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating: Number(form.rating) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit review");
      setMessage("Review submitted");
      if (form.serviceId) {
        setServiceId(form.serviceId);
        await loadReviews();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteReview(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/reviews/${deleteForm.reviewId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deleteForm.userId, isAdmin: false }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete review");
      setMessage("Review deleted");
      if (serviceId) await loadReviews();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6 rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">User Reviews</h1>

        <form onSubmit={submitReview} className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded border p-2"
            placeholder="User ID"
            value={form.userId || userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
            required
          />
          <input
            className="rounded border p-2"
            placeholder="Service ID"
            value={form.serviceId}
            onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
            required
          />
          <input
            className="rounded border p-2"
            placeholder="Booking ID"
            value={form.bookingId}
            onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
            required
          />
          <select
            className="rounded border p-2 sm:col-span-2"
            value={form.bookingId}
            onChange={(e) => {
              const selected = completedBookings.find((booking) => booking._id === e.target.value);
              setForm({
                ...form,
                bookingId: e.target.value,
                serviceId: selected?.serviceId?._id || form.serviceId,
              });
              if (selected?.serviceId?._id) setServiceId(selected.serviceId._id);
            }}
          >
            <option value="">Select completed booking (for review)</option>
            {completedBookings.map((booking) => (
              <option key={booking._id} value={booking._id}>
                {booking.serviceId?.title || "Service"} | {booking.timeSlot}
              </option>
            ))}
          </select>
          <input
            className="rounded border p-2"
            type="number"
            min="1"
            max="5"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
            required
          />
          <input
            className="rounded border p-2 sm:col-span-2"
            placeholder="Comment"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
          <button className="rounded bg-slate-900 px-4 py-2 text-white sm:col-span-2">
            Submit Review
          </button>
        </form>

        <form onSubmit={deleteReview} className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded border p-2"
            placeholder="Review ID to delete"
            value={deleteForm.reviewId}
            onChange={(e) => setDeleteForm({ ...deleteForm, reviewId: e.target.value })}
            required
          />
          <input
            className="rounded border p-2"
            placeholder="Your User ID"
            value={deleteForm.userId || userId}
            onChange={(e) => setDeleteForm({ ...deleteForm, userId: e.target.value })}
            required
          />
          <button className="rounded bg-red-700 px-4 py-2 text-white sm:col-span-2">
            Delete Review
          </button>
        </form>

        <div className="flex gap-2">
          <input
            className="w-full rounded border p-2"
            placeholder="Service ID to load reviews"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          />
          <button
            type="button"
            onClick={loadReviews}
            className="rounded bg-slate-800 px-4 py-2 text-white"
          >
            Load
          </button>
        </div>

        {message ? <p className="text-green-700">{message}</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        <div className="space-y-2">
          {reviews.map((review) => (
            <div key={review._id} className="rounded border p-3">
              <p className="text-sm">Review: {review._id}</p>
              <p className="text-sm">Rating: {review.rating}/5</p>
              <p className="text-sm">Comment: {review.comment || "-"}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
