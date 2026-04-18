import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    title: String,
    message: String,
    type: {
      type: String,
      enum: [
        "request_sent",
        "request_accepted",
        "request_rejected",
        "payment_made",
        "payment_received",
        "service_scheduled",
        "warning",
        "review_received",
        "complaint_filed",
      ],
      default: "request_sent",
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
