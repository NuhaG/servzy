import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      unique: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
  },
  { timestamps: true },
);

export default mongoose.models.Review || mongoose.model("Review", ReviewSchema);
