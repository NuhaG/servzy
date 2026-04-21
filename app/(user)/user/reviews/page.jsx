"use client";

import { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";

export default function UserReviewsPage() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const [submitting, setSubmitting] = useState(false);

  const selectedBooking = bookings.find((b) => b._id === selectedBookingId);
  const selectedServiceId = selectedBooking?.serviceId?._id || "";

  function showToast(msg, type = "success") {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  }

  async function loadReviews(serviceId) {
    if (!serviceId) { setReviews([]); return; }
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

        const bookingResponse = await fetch(
          `/api/bookings?userId=${encodeURIComponent(meData.user._id)}`
        );
        const bookingData = await bookingResponse.json();
        if (!bookingResponse.ok) throw new Error(bookingData.error || "Failed to load bookings");

        const completed = (bookingData || []).filter((b) => b.status === "completed");
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

  async function submitReview(e) {
    e.preventDefault();
    if (!user || !selectedBooking || rating === 0) return;
    setSubmitting(true);
    setError("");
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
      showToast("⭐ Review submitted successfully!");
      setComment("");
      setRating(0);
      await loadReviews(selectedBooking.serviceId?._id);
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  function starLabel(n) {
    return ["", "Poor", "Fair", "Good", "Great", "Excellent"][n] || "";
  }

  function renderStars(count, interactive = false, onSelect = null) {
    return (
      <div style={{ display: "flex", gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            onClick={() => interactive && onSelect && onSelect(n)}
            style={{
              fontSize: interactive ? 28 : 16,
              cursor: interactive ? "pointer" : "default",
              color: n <= count ? "#b91c1c" : "#fecaca",
              transition: "color 0.1s",
              lineHeight: 1,
            }}
          >
            ★
          </span>
        ))}
        {interactive && rating > 0 && (
          <span style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, alignSelf: "center", marginLeft: 6 }}>
            {starLabel(rating)}
          </span>
        )}
      </div>
    );
  }

  function getInitials(name) {
    if (!name) return "U";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <>
      <style>{`
        .ur-page { min-height: 100vh; background: #fef2f2; }
        .ur-shell { max-width: 720px; margin: 0 auto; padding: 36px 20px 64px; }

        /* Header */
        .ur-header {
          background: #fff; border: 1px solid #fecaca; border-left: 4px solid #b91c1c;
          border-radius: 12px; padding: 22px 26px; margin-bottom: 14px;
        }
        .ur-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #b91c1c; margin-bottom: 4px; }
        .ur-title { font-size: 22px; font-weight: 700; color: #111; letter-spacing: -0.02em; margin: 0; }
        .ur-sub { font-size: 13px; color: #888; margin-top: 3px; }

        /* Error */
        .ur-error { font-size: 13px; color: #b91c1c; background: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 9px 13px; margin-bottom: 12px; }

        /* Form card */
        .ur-form-card {
          background: #fff; border: 1px solid #fecaca; border-radius: 12px;
          padding: 22px 24px; margin-bottom: 14px;
        }
        .ur-section-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #b91c1c; margin-bottom: 12px; }

        /* Select */
        .ur-select {
          width: 100%; padding: 10px 14px; border: 1px solid #fecaca; border-radius: 9px;
          font-size: 13px; color: #111; background: #fef2f2; outline: none;
          transition: border-color 0.15s; appearance: none; cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23b91c1c' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          padding-right: 36px;
          margin-bottom: 14px;
        }
        .ur-select:focus { border-color: #b91c1c; background-color: #fff; }

        /* Star rating */
        .ur-star-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .ur-star-hint { font-size: 12px; color: #888; }

        /* Textarea */
        .ur-textarea {
          width: 100%; padding: 10px 14px; border: 1px solid #fecaca; border-radius: 9px;
          font-size: 13px; color: #111; background: #fef2f2; outline: none; resize: vertical;
          min-height: 90px; font-family: inherit; transition: border-color 0.15s;
          margin-bottom: 14px;
        }
        .ur-textarea:focus { border-color: #b91c1c; background: #fff; }

        /* Submit button */
        .ur-submit {
          width: 100%; padding: 11px; background: #7f1d1d; color: #fff; border: none;
          border-radius: 9px; font-size: 14px; font-weight: 700; cursor: pointer;
          transition: background 0.15s, opacity 0.15s; letter-spacing: 0.01em;
        }
        .ur-submit:hover:not(:disabled) { background: #991b1b; }
        .ur-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Reviews list */
        .ur-reviews-card {
          background: #fff; border: 1px solid #fecaca; border-radius: 12px; padding: 22px 24px;
        }
        .ur-review-item {
          padding: 14px 0; border-bottom: 1px solid #fef2f2; display: flex; gap: 12px; align-items: flex-start;
        }
        .ur-review-item:last-child { border-bottom: none; padding-bottom: 0; }
        .ur-review-avatar {
          width: 36px; height: 36px; border-radius: 50%; background: #7f1d1d;
          color: #fff; font-size: 13px; font-weight: 700; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ur-review-body { flex: 1; min-width: 0; }
        .ur-review-name { font-size: 13px; font-weight: 600; color: #111; margin-bottom: 3px; }
        .ur-review-comment { font-size: 13px; color: #555; margin-top: 4px; line-height: 1.5; }
        .ur-empty { font-size: 13px; color: #aaa; text-align: center; padding: 24px 0; }

        /* Toast */
        .ur-toast {
          position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(12px);
          background: #1a1a1a; color: #fff; padding: 10px 20px; border-radius: 8px;
          font-size: 13px; font-weight: 500; white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity 0.2s, transform 0.2s; z-index: 200;
          border-left: 3px solid #b91c1c;
        }
        .ur-toast.error { border-left-color: #b91c1c; }
        .ur-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      `}</style>

      <main className="ur-page">
        <AppNav />
        <div className="ur-shell">

          {/* Header */}
          <div className="ur-header">
            <p className="ur-eyebrow">User</p>
            <h1 className="ur-title">My Reviews</h1>
            <p className="ur-sub">Rate and review your completed bookings.</p>
          </div>

          {error && <p className="ur-error">{error}</p>}

          {/* Form */}
          <div className="ur-form-card">
            <p className="ur-section-label">Write a Review</p>

            <form onSubmit={submitReview}>
              {/* Booking selector */}
              <select
                className="ur-select"
                value={selectedBookingId}
                onChange={async (e) => {
                  const id = e.target.value;
                  setSelectedBookingId(id);
                  setRating(0);
                  setComment("");
                  const booking = bookings.find((b) => b._id === id);
                  await loadReviews(booking?.serviceId?._id);
                }}
              >
                <option value="">Select a completed booking...</option>
                {bookings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.serviceId?.title || "Service"} — {b.timeSlot}
                  </option>
                ))}
              </select>

              {/* Star rating */}
              <div className="ur-star-row">
                {renderStars(rating, true, setRating)}
                {rating === 0 && (
                  <span className="ur-star-hint">Tap to rate</span>
                )}
              </div>

              {/* Comment */}
              <textarea
                className="ur-textarea"
                placeholder="Share your experience with this service..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <button
                className="ur-submit"
                type="submit"
                disabled={submitting || !selectedBookingId || rating === 0}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>

          {/* Reviews list */}
          <div className="ur-reviews-card">
            <p className="ur-section-label">
              Reviews for this Service
              {reviews.length > 0 && (
                <span style={{ marginLeft: 8, fontSize: 11, color: "#888", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
                  ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                </span>
              )}
            </p>

            {reviews.length === 0 ? (
              <p className="ur-empty">No reviews for this service yet. Be the first!</p>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="ur-review-item">
                  <div className="ur-review-avatar">
                    {getInitials(review.userId?.name || "U")}
                  </div>
                  <div className="ur-review-body">
                    <div className="ur-review-name">
                      {review.userId?.name || "Anonymous"}
                    </div>
                    {renderStars(review.rating)}
                    {review.comment && (
                      <p className="ur-review-comment">{review.comment}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </main>

      {/* Toast */}
      <div className={`ur-toast ${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.msg}
      </div>
    </>
  );
}
