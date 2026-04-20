import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    scheduledDate: Date,
    timeSlot: String,
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
      default: "pending",
    },
    amount: Number,
    type: {
      type: String,
      enum: ["one-time", "contract"],
      default: "one-time",
    },
    notes: String,

    // ── Location fields ──────────────────────────────────────
    location: String,
    lat: Number,
    lng: Number,

    // ── Payment fields ──────────────────────────────────────
    paymentId: String,
    paymentOrderId: String,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);
