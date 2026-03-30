import mongoose from "mongoose";

const ProviderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    clerkId: {
      type: String,
      required: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    photo: String,
    bio: String,
    serviceTuple: {
      type: [String],
      default: [],
    },
    categories: [String],
    services: {
      type: [String],
      default: [],
    },
    location: String,
    lat: Number,
    lng: Number,
    status: {
      type: String,
      enum: ["pending", "approved", "blocked"],
      default: "pending",
    },
    reliabilityScore: Number,
    basePrice: Number,
    distance: String,
    acceptRate: Number,
    rejectRate: Number,
    totalBookings: {
      type: Number,
      default: 0,
    },
    cancellations: {
      type: Number,
      default: 0,
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
    },
    bookingCharge: {
      type: Number,
      default: 0,
    },
    avgRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
    flaggedCount: {
      type: Number,
      default: 0,
    },
    warningsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Provider ||
  mongoose.model("Provider", ProviderSchema);
